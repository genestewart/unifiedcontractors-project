<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add composite indexes for common query patterns
        Schema::table('projects', function (Blueprint $table) {
            // Composite index for status and dates (common dashboard queries)
            $table->index(['status', 'start_date', 'end_date'], 'idx_projects_status_dates');
            
            // Composite index for client queries with status
            $table->index(['client_email', 'status'], 'idx_projects_client_status');
            
            // Composite index for public projects
            $table->index(['is_public', 'qr_code_expires_at'], 'idx_projects_public_qr');
            
            // Index for progress reporting
            $table->index(['status', 'progress_percentage'], 'idx_projects_status_progress');
            
            // Full-text search index for project names and descriptions (MySQL/PostgreSQL only)
            if (DB::getDriverName() === 'mysql') {
                $table->fullText(['name', 'description'], 'idx_projects_fulltext');
            }
        });

        Schema::table('project_files', function (Blueprint $table) {
            // Composite index for project files by category and visibility
            $table->index(['project_id', 'category', 'is_public'], 'idx_files_project_cat_public');
            
            // Composite index for file listing with sort order
            $table->index(['project_id', 'sort_order', 'uploaded_at'], 'idx_files_project_sort');
            
            // Index for file size queries (for analytics)
            $table->index(['category', 'file_size'], 'idx_files_category_size');
            
            // Index for file integrity checks
            $table->index('checksum', 'idx_files_checksum');
            
            // Composite index for public file queries
            $table->index(['is_public', 'category', 'uploaded_at'], 'idx_files_public_category');
        });

        Schema::table('employees', function (Blueprint $table) {
            // Composite index for authentication with active status
            $table->index(['email', 'is_active'], 'idx_employees_email_active');
            
            // Index for role-based queries  
            $table->index('role', 'idx_employees_role');
        });

        Schema::table('client_feedback', function (Blueprint $table) {
            // Composite index for project feedback queries
            $table->index(['project_id', 'submitted_at'], 'idx_feedback_project_date');
            
            // Index for rating analytics
            $table->index('rating', 'idx_feedback_rating');
            
            // Composite index for recent feedback
            $table->index(['project_id', 'rating', 'submitted_at'], 'idx_feedback_project_rating_date');
        });

        // Add database-specific optimizations
        if (DB::getDriverName() === 'mysql') {
            // MySQL specific table optimizations
            DB::statement("ALTER TABLE projects ROW_FORMAT=COMPRESSED");
            DB::statement("ALTER TABLE project_files ROW_FORMAT=COMPRESSED");
            
            // Note: Global MySQL settings require SUPER privileges and are not
            // suitable for CI environments or shared hosting
        }

        if (DB::getDriverName() === 'sqlite') {
            // SQLite specific optimizations
            DB::statement("PRAGMA optimize");
            DB::statement("ANALYZE");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropIndex('idx_projects_status_dates');
            $table->dropIndex('idx_projects_client_status');
            $table->dropIndex('idx_projects_public_qr');
            $table->dropIndex('idx_projects_status_progress');
            if (DB::getDriverName() === 'mysql') {
                $table->dropIndex('idx_projects_fulltext');
            }
        });

        Schema::table('project_files', function (Blueprint $table) {
            $table->dropIndex('idx_files_project_cat_public');
            $table->dropIndex('idx_files_project_sort');
            $table->dropIndex('idx_files_category_size');
            $table->dropIndex('idx_files_checksum');
            $table->dropIndex('idx_files_public_category');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex('idx_employees_email_active');
            $table->dropIndex('idx_employees_role');
        });

        Schema::table('client_feedback', function (Blueprint $table) {
            $table->dropIndex('idx_feedback_project_date');
            $table->dropIndex('idx_feedback_rating');
            $table->dropIndex('idx_feedback_project_rating_date');
        });
    }
};