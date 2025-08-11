<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('project_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->restrictOnDelete();
            $table->string('filename');
            $table->string('original_filename');
            $table->string('file_path', 500);
            $table->bigInteger('file_size')->unsigned();
            $table->string('mime_type', 100);
            $table->enum('category', ['image', 'document', 'video', 'blueprint', 'other'])->default('other');
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('is_public')->default(false);
            $table->integer('sort_order')->unsigned()->default(0);
            $table->string('checksum', 64)->nullable(); // SHA-256 hash for integrity
            $table->timestamp('uploaded_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            // Indexes for performance
            $table->index('project_id');
            $table->index('employee_id');
            $table->index('category');
            $table->index('mime_type');
            $table->index('is_public');
            $table->index('sort_order');
            $table->index('uploaded_at');
            
            // File size constraint (50MB limit)
            $table->check('file_size > 0 AND file_size <= 52428800');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_files');
    }
};
