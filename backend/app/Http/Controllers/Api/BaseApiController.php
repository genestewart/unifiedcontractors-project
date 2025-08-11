<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

abstract class BaseApiController extends Controller
{
    /**
     * Default pagination size.
     */
    protected int $defaultPerPage = 20;

    /**
     * Maximum pagination size.
     */
    protected int $maxPerPage = 100;

    /**
     * Cache TTL in seconds (1 hour).
     */
    protected int $cacheTTL = 3600;

    /**
     * Return a successful response.
     */
    protected function successResponse($data, string $message = 'Success', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => now()->toISOString(),
        ], $status);
    }

    /**
     * Return an error response.
     */
    protected function errorResponse(string $message, int $status = 400, $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
            'timestamp' => now()->toISOString(),
        ];

        if ($errors) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $status);
    }

    /**
     * Return a paginated response.
     */
    protected function paginatedResponse($paginatedData, string $message = 'Success'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $paginatedData->items(),
            'meta' => [
                'current_page' => $paginatedData->currentPage(),
                'per_page' => $paginatedData->perPage(),
                'total' => $paginatedData->total(),
                'last_page' => $paginatedData->lastPage(),
                'from' => $paginatedData->firstItem(),
                'to' => $paginatedData->lastItem(),
            ],
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get pagination parameters from request.
     */
    protected function getPaginationParams(Request $request): array
    {
        $page = max(1, (int) $request->get('page', 1));
        $perPage = min(
            $this->maxPerPage,
            max(1, (int) $request->get('per_page', $this->defaultPerPage))
        );

        return [$page, $perPage];
    }

    /**
     * Generate cache key for request.
     */
    protected function getCacheKey(Request $request, string $prefix = ''): string
    {
        $params = $request->all();
        ksort($params);
        
        $key = $prefix . '_' . md5(serialize($params)) . '_' . auth()->id();
        
        return str_replace(['/', '\\', ' '], '_', $key);
    }

    /**
     * Cache response with proper tagging.
     */
    protected function cacheResponse(string $key, callable $callback, array $tags = [], int $ttl = null)
    {
        $ttl = $ttl ?? $this->cacheTTL;
        
        if (config('cache.default') === 'redis' && !empty($tags)) {
            return Cache::tags($tags)->remember($key, $ttl, $callback);
        }
        
        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Invalidate cache by tags.
     */
    protected function invalidateCache(array $tags): void
    {
        if (config('cache.default') === 'redis') {
            Cache::tags($tags)->flush();
        } else {
            // For non-Redis cache drivers, clear all cache
            Cache::flush();
        }
    }

    /**
     * Log performance metrics.
     */
    protected function logPerformance(Request $request, float $startTime, string $action = ''): void
    {
        $executionTime = microtime(true) - $startTime;
        $memoryUsage = memory_get_peak_usage(true);

        if ($executionTime > 1.0 || $memoryUsage > 50 * 1024 * 1024) { // Log slow requests or high memory usage
            Log::info('API Performance', [
                'action' => $action ?: $request->route()->getName(),
                'execution_time' => round($executionTime, 3),
                'memory_usage' => $this->formatBytes($memoryUsage),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'user_id' => auth()->id(),
            ]);
        }
    }

    /**
     * Format bytes to human readable format.
     */
    protected function formatBytes(int $size): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $unit = 0;
        
        while ($size >= 1024 && $unit < count($units) - 1) {
            $size /= 1024;
            $unit++;
        }
        
        return round($size, 2) . ' ' . $units[$unit];
    }

    /**
     * Optimize query with common performance patterns.
     */
    protected function optimizeQuery($query, array $options = [])
    {
        // Add select optimization
        if (isset($options['select'])) {
            $query->select($options['select']);
        }

        // Add eager loading
        if (isset($options['with'])) {
            $query->with($options['with']);
        }

        // Add constraints for performance
        if (isset($options['where'])) {
            foreach ($options['where'] as $field => $value) {
                $query->where($field, $value);
            }
        }

        // Add ordering
        if (isset($options['orderBy'])) {
            foreach ($options['orderBy'] as $field => $direction) {
                $query->orderBy($field, $direction);
            }
        }

        return $query;
    }

    /**
     * Handle database query exceptions gracefully.
     */
    protected function handleDatabaseException(\Exception $e, string $operation = 'database operation'): JsonResponse
    {
        Log::error("Database error during {$operation}", [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'user_id' => auth()->id(),
        ]);

        if (config('app.debug')) {
            return $this->errorResponse(
                "Database error: {$e->getMessage()}",
                500
            );
        }

        return $this->errorResponse(
            "An error occurred while processing your request. Please try again.",
            500
        );
    }
}