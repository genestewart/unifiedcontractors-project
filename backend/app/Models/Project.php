<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Carbon\Carbon;

class Project extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'client_name',
        'client_email',
        'status',
        'progress_percentage',
        'start_date',
        'end_date',
        'qr_code_token',
        'qr_code_expires_at',
        'is_public',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'qr_code_expires_at' => 'datetime',
        'is_public' => 'boolean',
        'progress_percentage' => 'decimal:2',
    ];

    /**
     * The attributes that should be appended to model arrays.
     *
     * @var array<string>
     */
    protected $appends = [
        'qr_code_url',
        'is_qr_code_expired',
        'days_until_deadline',
        'progress_status',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($project) {
            if (empty($project->qr_code_token)) {
                $project->qr_code_token = $project->generateQRCodeToken();
            }
        });
    }

    /**
     * Generate a unique QR code token.
     */
    public function generateQRCodeToken(): string
    {
        do {
            $token = 'UC_' . strtoupper(Str::random(10)) . '_' . time();
        } while (self::where('qr_code_token', $token)->exists());

        return $token;
    }

    /**
     * Get the QR code URL attribute.
     */
    public function getQrCodeUrlAttribute(): string
    {
        return url("/client/project/{$this->qr_code_token}");
    }

    /**
     * Check if QR code is expired.
     */
    public function getIsQrCodeExpiredAttribute(): bool
    {
        return $this->qr_code_expires_at && $this->qr_code_expires_at->isPast();
    }

    /**
     * Get days until deadline.
     */
    public function getDaysUntilDeadlineAttribute(): ?int
    {
        if (!$this->end_date) {
            return null;
        }

        return Carbon::now()->diffInDays($this->end_date, false);
    }

    /**
     * Get progress status based on percentage and dates.
     */
    public function getProgressStatusAttribute(): string
    {
        if ($this->status === 'completed') {
            return 'completed';
        }

        if ($this->status === 'on_hold') {
            return 'on_hold';
        }

        $daysUntilDeadline = $this->days_until_deadline;
        
        if ($daysUntilDeadline !== null && $daysUntilDeadline < 0) {
            return 'overdue';
        }

        if ($this->progress_percentage >= 90) {
            return 'near_completion';
        }

        if ($daysUntilDeadline !== null && $daysUntilDeadline <= 7) {
            return 'deadline_approaching';
        }

        if ($this->progress_percentage >= 50) {
            return 'on_track';
        }

        return 'needs_attention';
    }

    /**
     * Regenerate QR code token.
     */
    public function regenerateQRCode(?int $expiresInHours = null): bool
    {
        $this->qr_code_token = $this->generateQRCodeToken();
        
        if ($expiresInHours) {
            $this->qr_code_expires_at = now()->addHours($expiresInHours);
        } else {
            $this->qr_code_expires_at = null;
        }

        return $this->save();
    }

    /**
     * Check if QR code is accessible.
     */
    public function isQRCodeAccessible(): bool
    {
        return $this->is_public && !$this->is_qr_code_expired;
    }

    /**
     * Employee who created this project.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'created_by');
    }

    /**
     * Team members assigned to this project.
     */
    public function teamMembers(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'project_employees')
                    ->withPivot('role', 'assigned_at')
                    ->withTimestamps();
    }

    /**
     * Optimized team members for display.
     */
    public function teamMembersForDisplay(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'project_employees')
                    ->select(['employees.id', 'employees.first_name', 'employees.last_name', 'employees.email'])
                    ->withPivot('role')
                    ->orderBy('project_employees.role');
    }

    /**
     * Files associated with this project.
     */
    public function files(): HasMany
    {
        return $this->hasMany(ProjectFile::class);
    }

    /**
     * Optimized files relationship for listings.
     */
    public function filesForListing(): HasMany
    {
        return $this->hasMany(ProjectFile::class)
                    ->select(['id', 'project_id', 'filename', 'original_filename', 
                             'file_size', 'mime_type', 'category', 'is_public', 
                             'sort_order', 'uploaded_at'])
                    ->orderBy('sort_order')
                    ->orderBy('uploaded_at', 'desc');
    }

    /**
     * Recent files (last 7 days).
     */
    public function recentFiles(): HasMany
    {
        return $this->hasMany(ProjectFile::class)
                    ->where('uploaded_at', '>=', now()->subDays(7))
                    ->orderBy('uploaded_at', 'desc');
    }

    /**
     * Public files for client viewing.
     */
    public function publicFiles(): HasMany
    {
        return $this->hasMany(ProjectFile::class)->where('is_public', true);
    }

    /**
     * Client feedback for this project.
     */
    public function feedback(): HasMany
    {
        return $this->hasMany(ClientFeedback::class);
    }

    /**
     * Recent feedback (last 30 days).
     */
    public function recentFeedback(): HasMany
    {
        return $this->hasMany(ClientFeedback::class)
                    ->where('submitted_at', '>=', now()->subDays(30));
    }

    /**
     * Scope to get projects by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get active projects.
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['planning', 'active']);
    }

    /**
     * Scope to get public projects.
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope to get projects assigned to an employee.
     */
    public function scopeAssignedTo($query, int $employeeId)
    {
        return $query->whereHas('teamMembers', function ($q) use ($employeeId) {
            $q->where('employee_id', $employeeId);
        });
    }

    /**
     * Enhanced scope to search projects with full-text search and fallback.
     */
    public function scopeSearch($query, string $search)
    {
        // Use full-text search if available (MySQL)
        if (config('database.default') === 'mysql') {
            return $query->whereRaw(
                "MATCH(name, description) AGAINST(? IN NATURAL LANGUAGE MODE)",
                [$search]
            )->orWhere('client_name', 'LIKE', "%{$search}%")
             ->orWhere('client_email', 'LIKE', "%{$search}%");
        }
        
        // Fallback for other databases
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'LIKE', "%{$search}%")
              ->orWhere('description', 'LIKE', "%{$search}%")
              ->orWhere('client_name', 'LIKE', "%{$search}%")
              ->orWhere('client_email', 'LIKE', "%{$search}%");
        });
    }

    /**
     * Scope to filter by client email.
     */
    public function scopeByClient($query, string $clientEmail)
    {
        return $query->where('client_email', $clientEmail);
    }

    /**
     * Scope for efficient project listing with pagination.
     */
    public function scopeForListing($query, $filters = [])
    {
        $query->select([
            'id', 'name', 'client_name', 'status', 'progress_percentage',
            'start_date', 'end_date', 'created_at', 'updated_at'
        ]);

        // Apply filters efficiently using indexes
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['date_from'])) {
            $query->where('start_date', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('end_date', '<=', $filters['date_to']);
        }

        if (isset($filters['search'])) {
            $query->search($filters['search']);
        }

        return $query->with('creator:id,first_name,last_name')
                    ->orderBy('updated_at', 'desc');
    }

    /**
     * Scope for dashboard statistics.
     */
    public function scopeForDashboard($query)
    {
        return $query->select([
            'status',
            'progress_percentage',
            'start_date',
            'end_date',
            'created_at'
        ]);
    }

    /**
     * Scope for recent projects.
     */
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days))
                    ->orderBy('created_at', 'desc');
    }

    /**
     * Scope for projects with approaching deadlines.
     */
    public function scopeApproachingDeadline($query, int $days = 7)
    {
        return $query->whereNotNull('end_date')
                    ->where('end_date', '>=', now())
                    ->where('end_date', '<=', now()->addDays($days))
                    ->where('status', '!=', 'completed');
    }

    /**
     * Scope for overdue projects.
     */
    public function scopeOverdue($query)
    {
        return $query->whereNotNull('end_date')
                    ->where('end_date', '<', now())
                    ->whereNotIn('status', ['completed', 'archived']);
    }
}
