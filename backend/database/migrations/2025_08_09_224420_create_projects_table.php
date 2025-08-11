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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('client_name');
            $table->string('client_email');
            $table->enum('status', ['planning', 'active', 'on_hold', 'completed', 'archived'])->default('planning');
            $table->decimal('progress_percentage', 5, 2)->default(0.00);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('qr_code_token')->unique();
            $table->timestamp('qr_code_expires_at')->nullable();
            $table->boolean('is_public')->default(false);
            $table->foreignId('created_by')->constrained('employees')->restrictOnDelete();
            $table->timestamps();
            
            // Indexes for performance
            $table->index('name');
            $table->index('client_email');
            $table->index('status');
            $table->index('qr_code_token');
            $table->index('created_by');
            $table->index(['start_date', 'end_date']);
            $table->index('is_public');
            
            // Constraints
            $table->check('progress_percentage >= 0 AND progress_percentage <= 100');
        });
        
        // Add check constraint for date order using raw SQL
        DB::statement('ALTER TABLE projects ADD CONSTRAINT chk_date_order CHECK (end_date IS NULL OR end_date >= start_date)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
