<?php

namespace App\Http\Controllers\Api;

use App\Models\Project;
use App\Models\ProjectFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class FilesController extends BaseApiController
{
    /**
     * Cache tags for files.
     */
    protected array $cacheTags = ['files', 'projects'];

    /**
     * Maximum file size (50MB).
     */
    protected int $maxFileSize = 52428800;

    /**
     * Allowed file types.
     */
    protected array $allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'application/zip', 'application/x-rar-compressed',
        'application/x-dwg', 'image/vnd.dwg',
    ];

    /**
     * Display a listing of files.
     */
    public function index(Request $request): JsonResponse
    {
        $startTime = microtime(true);

        try {
            [$page, $perPage] = $this->getPaginationParams($request);
            $cacheKey = $this->getCacheKey($request, 'files_list');

            $files = $this->cacheResponse($cacheKey, function () use ($request, $perPage) {
                return ProjectFile::forListing([
                    'project_id' => $request->get('project_id'),
                    'category' => $request->get('category'),
                    'is_public' => $request->get('is_public'),
                    'search' => $request->get('search'),
                ])->with(['projectForDisplay', 'uploaderForDisplay'])
                  ->paginate($perPage);
            }, $this->cacheTags, 1800); // 30 minutes cache

            $this->logPerformance($request, $startTime, 'files.index');

            return $this->paginatedResponse($files, 'Files retrieved successfully');

        } catch (\Exception $e) {
            return $this->handleDatabaseException($e, 'retrieving files');
        }
    }

    /**
     * Store a newly uploaded file.
     */
    public function store(Request $request): JsonResponse
    {
        $startTime = microtime(true);

        $validator = Validator::make($request->all(), [
            'file' => [
                'required',
                'file',
                'max:' . ($this->maxFileSize / 1024), // Convert to KB for validation
                function ($attribute, $value, $fail) {
                    if (!in_array($value->getMimeType(), $this->allowedMimeTypes)) {
                        $fail('The file type is not supported.');
                    }
                },
            ],
            'project_id' => 'required|exists:projects,id',
            'category' => 'in:image,document,video,blueprint,other',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse(
                'Validation failed',
                422,
                $validator->errors()
            );
        }

        try {
            DB::beginTransaction();

            $file = $request->file('file');
            $project = Project::findOrFail($request->project_id);

            // Check authorization
            $user = auth()->user();
            if (!$user->hasRole(['admin', 'super_admin']) && 
                !$project->teamMembers->contains('id', $user->id) &&
                $project->created_by !== $user->id) {
                return $this->errorResponse('Unauthorized', 403);
            }

            // Generate unique filename
            $filename = $this->generateUniqueFilename($file);
            $filePath = "projects/{$project->id}/files/{$filename}";

            // Store file with chunked upload support for large files
            $storedPath = $this->storeFileOptimized($file, $filePath);

            // Extract metadata
            $metadata = $this->extractFileMetadata($file);

            // Create database record
            $projectFile = ProjectFile::create([
                'project_id' => $project->id,
                'employee_id' => $user->id,
                'filename' => $filename,
                'original_filename' => $file->getClientOriginalName(),
                'file_path' => $storedPath,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'category' => $request->get('category', $this->detectCategory($file)),
                'description' => $request->get('description'),
                'metadata' => $metadata,
                'is_public' => false, // Default to private
                'checksum' => hash_file('sha256', $file->getPathname()),
            ]);

            // Generate thumbnails for images
            if (str_starts_with($file->getMimeType(), 'image/')) {
                $this->generateThumbnails($projectFile);
            }

            DB::commit();

            // Load relationships for response
            $projectFile->load(['projectForDisplay', 'uploaderForDisplay']);

            // Invalidate cache
            $this->invalidateCache($this->cacheTags);

            $this->logPerformance($request, $startTime, 'files.store');

            return $this->successResponse(
                $projectFile,
                'File uploaded successfully',
                201
            );

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->handleDatabaseException($e, 'uploading file');
        }
    }

    /**
     * Initialize chunked upload session.
     */
    public function initializeChunkedUpload(Request $request): JsonResponse
    {
        $startTime = microtime(true);

        $validator = Validator::make($request->all(), [
            'filename' => 'required|string',
            'total_size' => 'required|integer|max:' . $this->maxFileSize,
            'total_chunks' => 'required|integer|min:1',
            'project_id' => 'required|exists:projects,id',
            'category' => 'in:image,document,video,blueprint,other',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse(
                'Validation failed',
                422,
                $validator->errors()
            );
        }

        try {
            $project = Project::findOrFail($request->project_id);

            // Check authorization
            $user = auth()->user();
            if (!$user->hasRole(['admin', 'super_admin']) && 
                !$project->teamMembers->contains('id', $user->id) &&
                $project->created_by !== $user->id) {
                return $this->errorResponse('Unauthorized', 403);
            }

            $uploadSession = Str::uuid()->toString();
            
            // Store upload session data in cache
            Cache::put("upload_session_{$uploadSession}", [
                'filename' => $request->filename,
                'total_size' => $request->total_size,
                'total_chunks' => $request->total_chunks,
                'project_id' => $request->project_id,
                'employee_id' => $user->id,
                'category' => $request->get('category'),
                'description' => $request->get('description'),
                'uploaded_chunks' => [],
                'created_at' => now(),
            ], 3600); // 1 hour expiry

            $this->logPerformance($request, $startTime, 'files.initializeChunkedUpload');

            return $this->successResponse([
                'upload_session' => $uploadSession,
            ], 'Chunked upload session initialized');

        } catch (\Exception $e) {
            return $this->handleDatabaseException($e, 'initializing chunked upload');
        }
    }

    /**
     * Upload a chunk of file data.
     */
    public function uploadChunk(Request $request): JsonResponse
    {
        $startTime = microtime(true);

        $validator = Validator::make($request->all(), [
            'chunk' => 'required|file',
            'upload_session' => 'required|string',
            'chunk_index' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse(
                'Validation failed',
                422,
                $validator->errors()
            );
        }

        try {
            $uploadSession = $request->upload_session;
            $chunkIndex = (int) $request->chunk_index;
            
            $sessionData = Cache::get("upload_session_{$uploadSession}");
            if (!$sessionData) {
                return $this->errorResponse('Upload session not found or expired', 404);
            }

            $chunk = $request->file('chunk');
            $chunkPath = "temp/chunks/{$uploadSession}/chunk_{$chunkIndex}";
            
            // Store chunk
            $storedPath = Storage::putFileAs(
                dirname($chunkPath),
                $chunk,
                basename($chunkPath)
            );

            // Update session data
            $sessionData['uploaded_chunks'][$chunkIndex] = [
                'path' => $storedPath,
                'size' => $chunk->getSize(),
                'uploaded_at' => now(),
            ];

            Cache::put("upload_session_{$uploadSession}", $sessionData, 3600);

            $this->logPerformance($request, $startTime, 'files.uploadChunk');

            return $this->successResponse([
                'chunk_index' => $chunkIndex,
                'uploaded_chunks' => count($sessionData['uploaded_chunks']),
                'total_chunks' => $sessionData['total_chunks'],
            ], 'Chunk uploaded successfully');

        } catch (\Exception $e) {
            return $this->handleDatabaseException($e, 'uploading chunk');
        }
    }

    /**
     * Complete chunked upload by combining chunks.
     */
    public function completeChunkedUpload(Request $request): JsonResponse
    {
        $startTime = microtime(true);

        $validator = Validator::make($request->all(), [
            'upload_session' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse(
                'Validation failed',
                422,
                $validator->errors()
            );
        }

        try {
            DB::beginTransaction();

            $uploadSession = $request->upload_session;
            $sessionData = Cache::get("upload_session_{$uploadSession}");
            
            if (!$sessionData) {
                return $this->errorResponse('Upload session not found or expired', 404);
            }

            // Verify all chunks are uploaded
            if (count($sessionData['uploaded_chunks']) !== $sessionData['total_chunks']) {
                return $this->errorResponse('Not all chunks have been uploaded', 400);
            }

            $project = Project::findOrFail($sessionData['project_id']);
            
            // Combine chunks into final file
            $finalFile = $this->combineChunks($uploadSession, $sessionData);

            // Extract metadata from combined file
            $metadata = $this->extractFileMetadataFromPath($finalFile);

            // Generate unique filename
            $filename = $this->generateUniqueFilenameFromString($sessionData['filename']);
            $filePath = "projects/{$project->id}/files/{$filename}";

            // Move final file to permanent location
            $permanentPath = Storage::move($finalFile, $filePath);

            // Create database record
            $projectFile = ProjectFile::create([
                'project_id' => $project->id,
                'employee_id' => $sessionData['employee_id'],
                'filename' => $filename,
                'original_filename' => $sessionData['filename'],
                'file_path' => $permanentPath ? $filePath : $finalFile,
                'file_size' => $sessionData['total_size'],
                'mime_type' => $metadata['mime_type'] ?? 'application/octet-stream',
                'category' => $sessionData['category'] ?? 'other',
                'description' => $sessionData['description'],
                'metadata' => $metadata,
                'is_public' => false,
                'checksum' => hash_file('sha256', Storage::path($filePath)),
            ]);

            // Clean up chunks and session
            $this->cleanupChunkedUpload($uploadSession);

            DB::commit();

            // Load relationships for response
            $projectFile->load(['projectForDisplay', 'uploaderForDisplay']);

            // Invalidate cache
            $this->invalidateCache($this->cacheTags);

            $this->logPerformance($request, $startTime, 'files.completeChunkedUpload');

            return $this->successResponse(
                $projectFile,
                'File uploaded successfully',
                201
            );

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->handleDatabaseException($e, 'completing chunked upload');
        }
    }

    /**
     * Display the specified file.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $startTime = microtime(true);

        try {
            $cacheKey = $this->getCacheKey($request, "file_detail_{$id}");

            $file = $this->cacheResponse($cacheKey, function () use ($id) {
                return ProjectFile::with([
                    'projectForDisplay',
                    'uploaderForDisplay'
                ])->findOrFail($id);
            }, $this->cacheTags, 3600);

            $this->logPerformance($request, $startTime, 'files.show');

            return $this->successResponse($file, 'File retrieved successfully');

        } catch (\Exception $e) {
            return $this->handleDatabaseException($e, 'retrieving file');
        }
    }

    /**
     * Download the specified file.
     */
    public function download(Request $request, int $id)
    {
        try {
            $file = ProjectFile::findOrFail($id);

            // Check if file exists
            if (!Storage::exists($file->file_path)) {
                return $this->errorResponse('File not found', 404);
            }

            // Return optimized file response
            return Storage::download(
                $file->file_path,
                $file->original_filename,
                [
                    'Cache-Control' => 'public, max-age=31536000', // 1 year
                    'ETag' => $file->checksum,
                ]
            );

        } catch (\Exception $e) {
            return $this->handleDatabaseException($e, 'downloading file');
        }
    }

    /**
     * Generate and serve file thumbnail.
     */
    public function thumbnail(Request $request, int $id, string $size = 'medium')
    {
        try {
            $file = ProjectFile::findOrFail($id);

            if (!$file->is_image) {
                return $this->errorResponse('Thumbnails are only available for images', 400);
            }

            $thumbnailUrl = $file->generateThumbnail($size);
            
            if (!$thumbnailUrl) {
                return $this->errorResponse('Failed to generate thumbnail', 500);
            }

            return redirect($thumbnailUrl);

        } catch (\Exception $e) {
            return $this->handleDatabaseException($e, 'generating thumbnail');
        }
    }

    /**
     * Delete the specified file.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $startTime = microtime(true);

        try {
            $file = ProjectFile::findOrFail($id);

            // Check authorization
            $user = auth()->user();
            if (!$user->hasRole(['admin', 'super_admin']) && 
                $file->employee_id !== $user->id) {
                return $this->errorResponse('Unauthorized', 403);
            }

            DB::beginTransaction();

            // Delete physical file
            if (Storage::exists($file->file_path)) {
                Storage::delete($file->file_path);
            }

            // Delete thumbnails if they exist
            $thumbnailPaths = [
                "thumbnails/{$file->id}_small.jpg",
                "thumbnails/{$file->id}_medium.jpg",
                "thumbnails/{$file->id}_large.jpg",
            ];

            foreach ($thumbnailPaths as $thumbnailPath) {
                if (Storage::exists("public/{$thumbnailPath}")) {
                    Storage::delete("public/{$thumbnailPath}");
                }
            }

            // Delete database record
            $file->delete();

            DB::commit();

            // Invalidate cache
            $this->invalidateCache($this->cacheTags);
            Cache::forget("file_detail_{$id}");

            $this->logPerformance($request, $startTime, 'files.destroy');

            return $this->successResponse(null, 'File deleted successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->handleDatabaseException($e, 'deleting file');
        }
    }

    /**
     * Helper methods
     */

    private function generateUniqueFilename($file): string
    {
        $extension = $file->getClientOriginalExtension();
        return Str::uuid() . '.' . $extension;
    }

    private function generateUniqueFilenameFromString(string $filename): string
    {
        $info = pathinfo($filename);
        $extension = $info['extension'] ?? '';
        return Str::uuid() . ($extension ? '.' . $extension : '');
    }

    private function storeFileOptimized($file, string $path): string
    {
        // Use putFileAs for better control
        return Storage::putFileAs(
            dirname($path),
            $file,
            basename($path),
            ['disk' => 'local']
        );
    }

    private function detectCategory($file): string
    {
        $mimeType = $file->getMimeType();
        
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        }
        
        if (in_array($mimeType, ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])) {
            return 'document';
        }
        
        if (str_starts_with($mimeType, 'video/')) {
            return 'video';
        }
        
        if (in_array($mimeType, ['application/x-dwg', 'image/vnd.dwg'])) {
            return 'blueprint';
        }
        
        return 'other';
    }

    private function extractFileMetadata($file): array
    {
        $metadata = [
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ];

        // Add image-specific metadata
        if (str_starts_with($file->getMimeType(), 'image/')) {
            try {
                $imageSize = getimagesize($file->getPathname());
                if ($imageSize) {
                    $metadata['width'] = $imageSize[0];
                    $metadata['height'] = $imageSize[1];
                    $metadata['dimensions'] = $imageSize[0] . 'x' . $imageSize[1];
                }
            } catch (\Exception $e) {
                // Ignore metadata extraction errors
            }
        }

        return $metadata;
    }

    private function extractFileMetadataFromPath(string $filePath): array
    {
        $fullPath = Storage::path($filePath);
        $metadata = [
            'size' => filesize($fullPath),
        ];

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $metadata['mime_type'] = finfo_file($finfo, $fullPath);
        finfo_close($finfo);

        return $metadata;
    }

    private function generateThumbnails(ProjectFile $file): void
    {
        try {
            $sizes = ['small', 'medium', 'large'];
            foreach ($sizes as $size) {
                $file->generateThumbnail($size);
            }
        } catch (\Exception $e) {
            // Log but don't fail the upload
            \Log::warning("Failed to generate thumbnails for file {$file->id}: " . $e->getMessage());
        }
    }

    private function combineChunks(string $uploadSession, array $sessionData): string
    {
        $tempPath = "temp/combined/{$uploadSession}";
        $fullTempPath = Storage::path($tempPath);
        
        // Ensure directory exists
        $dir = dirname($fullTempPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $handle = fopen($fullTempPath, 'wb');

        for ($i = 0; $i < $sessionData['total_chunks']; $i++) {
            if (!isset($sessionData['uploaded_chunks'][$i])) {
                throw new \Exception("Missing chunk {$i}");
            }

            $chunkPath = Storage::path($sessionData['uploaded_chunks'][$i]['path']);
            $chunkHandle = fopen($chunkPath, 'rb');
            
            while (!feof($chunkHandle)) {
                fwrite($handle, fread($chunkHandle, 8192));
            }
            
            fclose($chunkHandle);
        }

        fclose($handle);
        return $tempPath;
    }

    private function cleanupChunkedUpload(string $uploadSession): void
    {
        try {
            // Delete chunk files
            $chunkDir = "temp/chunks/{$uploadSession}";
            if (Storage::exists($chunkDir)) {
                Storage::deleteDirectory($chunkDir);
            }

            // Delete combined file
            $combinedFile = "temp/combined/{$uploadSession}";
            if (Storage::exists($combinedFile)) {
                Storage::delete($combinedFile);
            }

            // Delete session data
            Cache::forget("upload_session_{$uploadSession}");
            
        } catch (\Exception $e) {
            \Log::warning("Failed to cleanup chunked upload {$uploadSession}: " . $e->getMessage());
        }
    }
}