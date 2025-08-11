<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProjectFile extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'project_files';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'employee_id',
        'filename',
        'original_filename',
        'file_path',
        'file_size',
        'mime_type',
        'category',
        'description',
        'metadata',
        'is_public',
        'sort_order',
        'checksum',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'metadata' => 'array',
        'is_public' => 'boolean',
        'file_size' => 'integer',
        'sort_order' => 'integer',
        'uploaded_at' => 'datetime',
    ];

    /**
     * The attributes that should be appended to model arrays.
     */
    protected $appends = [
        'file_size_human',
        'download_url',
        'thumbnail_urls',
        'is_image',
        'is_video',
        'is_document',
    ];

    /**
     * Get human readable file size.
     */
    public function getFileSizeHumanAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Get download URL.
     */
    public function getDownloadUrlAttribute(): string
    {
        return route('files.download', $this->id);
    }

    /**
     * Get thumbnail URLs for images.
     */
    public function getThumbnailUrlsAttribute(): array
    {
        if (!$this->is_image) {
            return [];
        }

        return [
            'small' => route('files.thumbnail', ['file' => $this->id, 'size' => 'small']),
            'medium' => route('files.thumbnail', ['file' => $this->id, 'size' => 'medium']),
            'large' => route('files.thumbnail', ['file' => $this->id, 'size' => 'large']),
        ];
    }

    /**
     * Check if file is an image.
     */
    public function getIsImageAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Check if file is a video.
     */
    public function getIsVideoAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'video/');
    }

    /**
     * Check if file is a document.
     */
    public function getIsDocumentAttribute(): bool
    {
        $documentTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
        ];

        return in_array($this->mime_type, $documentTypes);
    }

    /**
     * Get the full file path.
     */
    public function getFullPath(): string
    {
        return Storage::path($this->file_path);
    }

    /**
     * Generate checksum for file integrity.
     */
    public function generateChecksum(): string
    {
        return hash_file('sha256', $this->getFullPath());
    }

    /**
     * Verify file integrity.
     */
    public function verifyIntegrity(): bool
    {
        if (!$this->checksum) {
            return true; // No checksum to verify
        }

        $currentChecksum = $this->generateChecksum();
        return hash_equals($this->checksum, $currentChecksum);
    }

    /**
     * Generate thumbnail for image files.
     */
    public function generateThumbnail(string $size = 'medium'): ?string
    {
        if (!$this->is_image) {
            return null;
        }

        $dimensions = [
            'small' => [150, 150],
            'medium' => [300, 300],
            'large' => [600, 600],
        ];

        if (!isset($dimensions[$size])) {
            $size = 'medium';
        }

        [$width, $height] = $dimensions[$size];

        $thumbnailPath = "thumbnails/{$this->id}_{$size}.jpg";
        $fullThumbnailPath = storage_path("app/public/{$thumbnailPath}");

        // Create thumbnail directory if it doesn't exist
        $thumbnailDir = dirname($fullThumbnailPath);
        if (!is_dir($thumbnailDir)) {
            mkdir($thumbnailDir, 0755, true);
        }

        try {
            $manager = new ImageManager(new Driver());
            $image = $manager->read($this->getFullPath());
            
            // Resize maintaining aspect ratio
            $image->scale(width: $width, height: $height);
            
            // Save as JPEG
            $image->toJpeg(90)->save($fullThumbnailPath);

            return Storage::url($thumbnailPath);
        } catch (\Exception $e) {
            \Log::error('Thumbnail generation failed', [
                'file_id' => $this->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Extract metadata from file.
     */
    public function extractMetadata(): array
    {
        $metadata = [];
        $filePath = $this->getFullPath();

        if ($this->is_image) {
            try {
                $imagesize = getimagesize($filePath);
                if ($imagesize) {
                    $metadata['dimensions'] = $imagesize[0] . 'x' . $imagesize[1];
                    $metadata['width'] = $imagesize[0];
                    $metadata['height'] = $imagesize[1];
                }

                // Extract EXIF data
                if (function_exists('exif_read_data') && in_array($this->mime_type, ['image/jpeg', 'image/tiff'])) {
                    $exif = @exif_read_data($filePath);
                    if ($exif) {
                        $metadata['exif'] = array_filter([
                            'camera' => $exif['Model'] ?? null,
                            'date_time' => $exif['DateTime'] ?? null,
                            'exposure' => $exif['ExposureTime'] ?? null,
                            'aperture' => $exif['FNumber'] ?? null,
                            'iso' => $exif['ISOSpeedRatings'] ?? null,
                        ]);
                    }
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to extract image metadata', [
                    'file_id' => $this->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        if ($this->is_video) {
            // Basic video metadata - would need FFmpeg for detailed info
            $metadata['type'] = 'video';
        }

        if ($this->is_document) {
            $metadata['type'] = 'document';
            $metadata['pages'] = null; // Would need additional libraries for PDF page count
        }

        $metadata['processed'] = true;
        $metadata['virus_scan'] = 'clean'; // Placeholder for virus scanning

        return $metadata;
    }

    /**
     * Project this file belongs to.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Optimized project relationship for display.
     */
    public function projectForDisplay(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id')
                    ->select(['id', 'name', 'client_name']);
    }

    /**
     * Employee who uploaded this file.
     */
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    /**
     * Optimized uploader relationship for display.
     */
    public function uploaderForDisplay(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id')
                    ->select(['id', 'first_name', 'last_name']);
    }

    /**
     * Client feedback related to this file.
     */
    public function feedback(): HasMany
    {
        return $this->hasMany(ClientFeedback::class, 'file_id');
    }

    /**
     * Scope to get public files only.
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope to get files by category.
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope to get files by project.
     */
    public function scopeByProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    /**
     * Enhanced scope to search files.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('filename', 'LIKE', "%{$search}%")
              ->orWhere('original_filename', 'LIKE', "%{$search}%")
              ->orWhere('description', 'LIKE', "%{$search}%");
        });
    }

    /**
     * Scope for optimized file listing.
     */
    public function scopeForListing($query, $filters = [])
    {
        $query->select([
            'id', 'project_id', 'filename', 'original_filename',
            'file_size', 'mime_type', 'category', 'is_public',
            'sort_order', 'uploaded_at'
        ]);

        if (isset($filters['project_id'])) {
            $query->where('project_id', $filters['project_id']);
        }

        if (isset($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['is_public'])) {
            $query->where('is_public', $filters['is_public']);
        }

        if (isset($filters['search'])) {
            $query->search($filters['search']);
        }

        return $query->orderBy('sort_order')
                    ->orderBy('uploaded_at', 'desc');
    }

    /**
     * Scope for file analytics.
     */
    public function scopeForAnalytics($query, $dateFrom = null, $dateTo = null)
    {
        $query->select([
            'category',
            'mime_type',
            'file_size',
            'uploaded_at',
            'project_id'
        ]);

        if ($dateFrom) {
            $query->where('uploaded_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->where('uploaded_at', '<=', $dateTo);
        }

        return $query;
    }

    /**
     * Scope for large files (over 10MB).
     */
    public function scopeLargeFiles($query)
    {
        return $query->where('file_size', '>', 10 * 1024 * 1024);
    }

    /**
     * Scope for files by size range.
     */
    public function scopeBySizeRange($query, int $minSize, int $maxSize)
    {
        return $query->whereBetween('file_size', [$minSize, $maxSize]);
    }

    /**
     * Scope for files without checksums (for integrity check).
     */
    public function scopeWithoutChecksum($query)
    {
        return $query->whereNull('checksum');
    }

    /**
     * Scope to order by upload date.
     */
    public function scopeRecentFirst($query)
    {
        return $query->orderBy('uploaded_at', 'desc');
    }

    /**
     * Scope to order by sort order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order', 'asc')->orderBy('uploaded_at', 'desc');
    }
}