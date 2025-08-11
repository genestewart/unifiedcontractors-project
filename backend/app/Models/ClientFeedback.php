<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientFeedback extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'client_feedback';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'file_id',
        'feedback_text',
        'rating',
        'status',
        'client_email',
        'submitted_at',
        'reviewed_at',
        'reviewed_by',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'rating' => 'integer',
    ];

    /**
     * The attributes that should be appended to model arrays.
     */
    protected $appends = [
        'confirmation_number',
        'is_reviewed',
        'time_since_submission',
        'star_rating',
    ];

    /**
     * Generate confirmation number.
     */
    public function getConfirmationNumberAttribute(): string
    {
        return 'FB-' . date('Y') . '-' . str_pad($this->project_id, 3, '0', STR_PAD_LEFT) . '-' . str_pad($this->id, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Check if feedback has been reviewed.
     */
    public function getIsReviewedAttribute(): bool
    {
        return $this->reviewed_at !== null;
    }

    /**
     * Get time since submission in human readable format.
     */
    public function getTimeSinceSubmissionAttribute(): string
    {
        if (!$this->submitted_at) {
            return 'Unknown';
        }

        return $this->submitted_at->diffForHumans();
    }

    /**
     * Get star rating display.
     */
    public function getStarRatingAttribute(): string
    {
        if (!$this->rating) {
            return 'No rating';
        }

        return str_repeat('★', $this->rating) . str_repeat('☆', 5 - $this->rating) . ' (' . $this->rating . '/5)';
    }

    /**
     * Mark feedback as reviewed.
     */
    public function markAsReviewed(int $reviewedBy): bool
    {
        $this->status = 'reviewed';
        $this->reviewed_at = now();
        $this->reviewed_by = $reviewedBy;

        return $this->save();
    }

    /**
     * Update feedback status.
     */
    public function updateStatus(string $status, int $reviewedBy = null): bool
    {
        $this->status = $status;

        if ($reviewedBy) {
            $this->reviewed_by = $reviewedBy;
            
            if (!$this->reviewed_at) {
                $this->reviewed_at = now();
            }
        }

        return $this->save();
    }

    /**
     * Get the average rating for similar feedback.
     */
    public function getSimilarFeedbackAverage(): float
    {
        $query = static::where('project_id', $this->project_id)
                      ->whereNotNull('rating');

        if ($this->file_id) {
            $query->where('file_id', $this->file_id);
        }

        return $query->avg('rating') ?? 0.0;
    }

    /**
     * Project this feedback belongs to.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * File this feedback is related to (optional).
     */
    public function file(): BelongsTo
    {
        return $this->belongsTo(ProjectFile::class, 'file_id');
    }

    /**
     * Employee who reviewed this feedback.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'reviewed_by');
    }

    /**
     * Scope to get new feedback.
     */
    public function scopeNew($query)
    {
        return $query->where('status', 'new');
    }

    /**
     * Scope to get reviewed feedback.
     */
    public function scopeReviewed($query)
    {
        return $query->where('status', 'reviewed');
    }

    /**
     * Scope to get feedback by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get feedback by rating.
     */
    public function scopeByRating($query, int $rating)
    {
        return $query->where('rating', $rating);
    }

    /**
     * Scope to get feedback with rating.
     */
    public function scopeWithRating($query)
    {
        return $query->whereNotNull('rating');
    }

    /**
     * Scope to get feedback without rating.
     */
    public function scopeWithoutRating($query)
    {
        return $query->whereNull('rating');
    }

    /**
     * Scope to get feedback by client.
     */
    public function scopeByClient($query, string $clientEmail)
    {
        return $query->where('client_email', $clientEmail);
    }

    /**
     * Scope to get feedback for a project.
     */
    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    /**
     * Scope to get recent feedback.
     */
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('submitted_at', '>=', now()->subDays($days));
    }

    /**
     * Scope to search feedback.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where('feedback_text', 'LIKE', "%{$search}%");
    }

    /**
     * Scope to order by submission date.
     */
    public function scopeLatestFirst($query)
    {
        return $query->orderBy('submitted_at', 'desc');
    }

    /**
     * Scope to get high-rated feedback (4-5 stars).
     */
    public function scopeHighRated($query)
    {
        return $query->whereIn('rating', [4, 5]);
    }

    /**
     * Scope to get low-rated feedback (1-2 stars).
     */
    public function scopeLowRated($query)
    {
        return $query->whereIn('rating', [1, 2]);
    }

    /**
     * Scope to get unresolved feedback.
     */
    public function scopeUnresolved($query)
    {
        return $query->whereIn('status', ['new', 'in_progress']);
    }
}