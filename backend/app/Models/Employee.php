<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Hash;

class Employee extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'email',
        'password_hash',
        'first_name',
        'last_name',
        'role',
        'is_active',
        'last_login_at',
        'failed_login_attempts',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Get the password for authentication.
     */
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    /**
     * Set the password attribute.
     */
    public function setPasswordAttribute($password)
    {
        $this->attributes['password_hash'] = Hash::make($password);
    }

    /**
     * Get the employee's full name.
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Check if employee has a specific role.
     */
    public function hasRole(string|array $roles): bool
    {
        if (is_string($roles)) {
            return $this->role === $roles;
        }

        return in_array($this->role, $roles);
    }

    /**
     * Check if employee has any of the given roles.
     */
    public function hasAnyRole(array $roles): bool
    {
        return in_array($this->role, $roles);
    }

    /**
     * Get permissions based on role.
     */
    public function getPermissionsAttribute(): array
    {
        return match($this->role) {
            'super_admin' => [
                'employees.create', 'employees.read', 'employees.update', 'employees.delete',
                'projects.create', 'projects.read', 'projects.update', 'projects.delete',
                'files.upload', 'files.read', 'files.update', 'files.delete',
                'feedback.read', 'feedback.update', 'admin.all'
            ],
            'admin' => [
                'employees.create', 'employees.read', 'employees.update',
                'projects.create', 'projects.read', 'projects.update', 'projects.delete',
                'files.upload', 'files.read', 'files.update', 'files.delete',
                'feedback.read', 'feedback.update'
            ],
            'project_manager' => [
                'projects.create', 'projects.read', 'projects.update',
                'files.upload', 'files.read', 'files.update',
                'feedback.read', 'feedback.update'
            ],
            'employee' => [
                'projects.read', 'files.upload', 'files.read', 'feedback.read'
            ],
            default => ['projects.read', 'files.read']
        };
    }

    /**
     * Check if employee has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissions);
    }

    /**
     * Projects created by this employee.
     */
    public function createdProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'created_by');
    }

    /**
     * Projects this employee is assigned to.
     */
    public function assignedProjects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_employees')
                    ->withPivot('role', 'assigned_at')
                    ->withTimestamps();
    }

    /**
     * Files uploaded by this employee.
     */
    public function uploadedFiles(): HasMany
    {
        return $this->hasMany(ProjectFile::class, 'employee_id');
    }

    /**
     * Feedback reviewed by this employee.
     */
    public function reviewedFeedback(): HasMany
    {
        return $this->hasMany(ClientFeedback::class, 'reviewed_by');
    }

    /**
     * Scope to get active employees only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get employees by role.
     */
    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }
}
