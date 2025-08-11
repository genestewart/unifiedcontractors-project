<?php

namespace App\Http\Controllers\Api;

use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ProjectsController extends BaseApiController
{
    /**
     * Cache tags for projects.
     */
    protected array $cacheTags = ['projects'];

    /**
     * Display a listing of projects with optimized queries.
     */
    public function index(Request $request): JsonResponse
    {
        $startTime = microtime(true);
        
        try {
            [$page, $perPage] = $this->getPaginationParams($request);
            $cacheKey = $this->getCacheKey($request, 'projects_list');

            $projects = $this->cacheResponse($cacheKey, function () use ($request, $perPage) {
                $query = Project::forListing([
                    'status' => $request->get('status'),
                    'search' => $request->get('search'),
                    'date_from' => $request->get('date_from'),
                    'date_to' => $request->get('date_to'),
                ]);

                // Apply employee filter if user doesn't have admin privileges
                $user = auth()->user();
                if (!$user->hasRole(['admin', 'super_admin'])) {
                    $query->assignedTo($user->id);
                }

                return $query->paginate($perPage);
            }, $this->cacheTags, 1800); // 30 minutes cache

            $this->logPerformance($request, $startTime, 'projects.index');
            
            return $this->paginatedResponse($projects, 'Projects retrieved successfully');

        } catch (\Exception $e) {
            return $this->handleDatabaseException($e, 'retrieving projects');
        }
    }

    /**
     * Store a newly created project.
     */
    public function store(Request $request): JsonResponse
    {
        $startTime = microtime(true);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'client_name' => 'required|string|max:255',
            'client_email' => 'required|email|max:255',
            'status' => 'in:planning,active,on_hold,completed,archived',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'is_public' => 'boolean',
            'team_members' => 'array',
            'team_members.*' => 'exists:employees,id',
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

            $project = Project::create(array_merge(
                $validator->validated(),
                ['created_by' => auth()->id()]
            ));

            // Attach team members if provided
            if ($request->has('team_members')) {
                $teamMembers = collect($request->team_members)->mapWithKeys(function ($memberId) {
                    return [$memberId => [
                        'role' => 'team_member',
                        'assigned_at' => now(),
                    ]];
                });
                
                $project->teamMembers()->attach($teamMembers);
            }

            // Load relationships for response
            $project->load(['creator:id,first_name,last_name', 'teamMembersForDisplay']);

            DB::commit();

            // Invalidate cache
            $this->invalidateCache($this->cacheTags);

            $this->logPerformance($request, $startTime, 'projects.store');

            return $this->successResponse(
                $project,
                'Project created successfully',
                201
            );

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->handleDatabaseException($e, 'creating project');
        }
    }

    /**
     * Display the specified project.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $startTime = microtime(true);

        try {
            $cacheKey = $this->getCacheKey($request, "project_detail_{$id}");

            $project = $this->cacheResponse($cacheKey, function () use ($id) {
                return Project::with([
                    'creator:id,first_name,last_name,email',
                    'teamMembersForDisplay',
                    'filesForListing' => function ($query) {
                        $query->limit(10); // Limit recent files for performance
                    },
                    'recentFeedback' => function ($query) {
                        $query->latest()->limit(5);
                    }
                ])->findOrFail($id);
            }, $this->cacheTags, 3600); // 1 hour cache

            // Check authorization
            $user = auth()->user();
            if (!$user->hasRole(['admin', 'super_admin']) && 
                !$project->teamMembers->contains('id', $user->id) &&
                $project->created_by !== $user->id) {
                return $this->errorResponse('Unauthorized', 403);
            }

            $this->logPerformance($request, $startTime, 'projects.show');

            return $this->successResponse($project, 'Project retrieved successfully');

        } catch (\Exception $e) {
            return $this->handleDatabaseException($e, 'retrieving project');
        }
    }

    /**
     * Update the specified project.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $startTime = microtime(true);

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'client_name' => 'string|max:255',
            'client_email' => 'email|max:255',
            'status' => 'in:planning,active,on_hold,completed,archived',
            'progress_percentage' => 'numeric|between:0,100',
            'start_date' => 'date',
            'end_date' => 'nullable|date|after:start_date',
            'is_public' => 'boolean',
            'team_members' => 'array',
            'team_members.*' => 'exists:employees,id',
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

            $project = Project::findOrFail($id);

            // Check authorization
            $user = auth()->user();
            if (!$user->hasRole(['admin', 'super_admin', 'project_manager']) && 
                $project->created_by !== $user->id) {
                return $this->errorResponse('Unauthorized', 403);
            }

            $project->update($validator->validated());

            // Update team members if provided
            if ($request->has('team_members')) {
                $teamMembers = collect($request->team_members)->mapWithKeys(function ($memberId) {
                    return [$memberId => [
                        'role' => 'team_member',
                        'assigned_at' => now(),
                    ]];
                });
                
                $project->teamMembers()->sync($teamMembers);
            }

            // Load fresh relationships
            $project->fresh(['creator:id,first_name,last_name', 'teamMembersForDisplay']);

            DB::commit();

            // Invalidate cache
            $this->invalidateCache($this->cacheTags);
            Cache::forget("project_detail_{$id}");

            $this->logPerformance($request, $startTime, 'projects.update');

            return $this->successResponse($project, 'Project updated successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->handleDatabaseException($e, 'updating project');
        }
    }

    /**
     * Remove the specified project.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $startTime = microtime(true);

        try {
            $project = Project::findOrFail($id);

            // Check authorization
            $user = auth()->user();
            if (!$user->hasRole(['admin', 'super_admin']) && 
                $project->created_by !== $user->id) {
                return $this->errorResponse('Unauthorized', 403);
            }

            DB::beginTransaction();

            // Soft delete or hard delete based on business rules
            $project->delete();

            DB::commit();

            // Invalidate cache
            $this->invalidateCache($this->cacheTags);

            $this->logPerformance($request, $startTime, 'projects.destroy');

            return $this->successResponse(null, 'Project deleted successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->handleDatabaseException($e, 'deleting project');
        }
    }

    /**
     * Get project statistics for dashboard.
     */
    public function statistics(Request $request): JsonResponse
    {
        $startTime = microtime(true);

        try {
            $cacheKey = $this->getCacheKey($request, 'project_stats');

            $stats = $this->cacheResponse($cacheKey, function () {
                $user = auth()->user();
                $query = Project::forDashboard();

                // Apply user constraints
                if (!$user->hasRole(['admin', 'super_admin'])) {
                    $query->assignedTo($user->id);
                }

                return [
                    'total' => $query->count(),
                    'by_status' => $query->groupBy('status')
                        ->selectRaw('status, count(*) as count')
                        ->pluck('count', 'status'),
                    'recent' => $query->recent(30)->count(),
                    'approaching_deadline' => $query->approachingDeadline()->count(),
                    'overdue' => $query->overdue()->count(),
                    'avg_progress' => round($query->avg('progress_percentage'), 1),
                    'completion_rate' => $this->getCompletionRate($query),
                ];
            }, $this->cacheTags, 1800); // 30 minutes cache

            $this->logPerformance($request, $startTime, 'projects.statistics');

            return $this->successResponse($stats, 'Project statistics retrieved successfully');

        } catch (\Exception $e) {
            return $this->handleDatabaseException($e, 'retrieving project statistics');
        }
    }

    /**
     * Calculate project completion rate.
     */
    private function getCompletionRate($query): float
    {
        $total = $query->count();
        if ($total === 0) {
            return 0;
        }

        $completed = $query->where('status', 'completed')->count();
        return round(($completed / $total) * 100, 1);
    }

    /**
     * Generate QR code for project.
     */
    public function generateQRCode(Request $request, int $id): JsonResponse
    {
        $startTime = microtime(true);

        $validator = Validator::make($request->all(), [
            'expires_in_hours' => 'nullable|integer|min:1|max:8760', // Max 1 year
        ]);

        if ($validator->fails()) {
            return $this->errorResponse(
                'Validation failed',
                422,
                $validator->errors()
            );
        }

        try {
            $project = Project::findOrFail($id);

            // Check authorization
            $user = auth()->user();
            if (!$user->hasRole(['admin', 'super_admin', 'project_manager']) && 
                $project->created_by !== $user->id) {
                return $this->errorResponse('Unauthorized', 403);
            }

            $expiresInHours = $request->get('expires_in_hours', 24);
            $project->regenerateQRCode($expiresInHours);

            // Invalidate cache
            Cache::forget("project_detail_{$id}");

            $this->logPerformance($request, $startTime, 'projects.generateQRCode');

            return $this->successResponse([
                'qr_code_token' => $project->qr_code_token,
                'qr_code_url' => $project->qr_code_url,
                'expires_at' => $project->qr_code_expires_at,
            ], 'QR code generated successfully');

        } catch (\Exception $e) {
            return $this->handleDatabaseException($e, 'generating QR code');
        }
    }
}