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
        Schema::create('client_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('file_id')->nullable()->constrained('project_files')->nullOnDelete();
            $table->text('feedback_text');
            $table->tinyInteger('rating')->unsigned()->nullable();
            $table->enum('status', ['new', 'reviewed', 'in_progress', 'resolved'])->default('new');
            $table->string('client_email');
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('employees')->nullOnDelete();
            $table->timestamps();
            
            // Indexes for performance
            $table->index('project_id');
            $table->index('file_id');
            $table->index('status');
            $table->index('client_email');
            $table->index('submitted_at');
            $table->index('reviewed_by');
            
            // Rating constraint (1-5 stars)
            $table->check('rating IS NULL OR (rating >= 1 AND rating <= 5)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_feedback');
    }
};
