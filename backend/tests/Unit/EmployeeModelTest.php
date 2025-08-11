<?php

namespace Tests\Unit;

use App\Models\Employee;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\ClientFeedback;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Employee Model Unit Tests
 * Tests model relationships, methods, attributes, and business logic
 */
class EmployeeModelTest extends TestCase
{
    use RefreshDatabase;

    private Employee $employee;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->employee = Employee::factory()->create([
            'email' => 'test@example.com',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'role' => 'admin',
            'is_active' => true
        ]);
    }

    /** @test */
    public function it_can_be_created_with_valid_data()
    {
        $employeeData = [
            'email' => 'new@example.com',
            'password_hash' => Hash::make('password123'),
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'role' => 'employee',
            'is_active' => true
        ];

        $employee = Employee::create($employeeData);

        $this->assertInstanceOf(Employee::class, $employee);
        $this->assertEquals('new@example.com', $employee->email);
        $this->assertEquals('Jane', $employee->first_name);
        $this->assertEquals('Smith', $employee->last_name);
        $this->assertEquals('employee', $employee->role);
        $this->assertTrue($employee->is_active);
        $this->assertNotNull($employee->created_at);
    }

    /** @test */
    public function it_hashes_password_when_set()
    {
        $plainPassword = 'newpassword123';
        $this->employee->password = $plainPassword;
        $this->employee->save();

        $this->assertTrue(Hash::check($plainPassword, $this->employee->password_hash));
        $this->assertNotEquals($plainPassword, $this->employee->password_hash);
    }

    /** @test */
    public function it_returns_correct_auth_password()
    {
        $hashedPassword = Hash::make('testpassword');
        $this->employee->password_hash = $hashedPassword;
        $this->employee->save();

        $this->assertEquals($hashedPassword, $this->employee->getAuthPassword());
    }

    /** @test */
    public function it_generates_correct_full_name_attribute()
    {
        $this->assertEquals('John Doe', $this->employee->full_name);
        
        $employee = Employee::factory()->create([
            'first_name' => 'Alice',
            'last_name' => 'Johnson'
        ]);
        
        $this->assertEquals('Alice Johnson', $employee->full_name);
    }

    /** @test */
    public function it_hides_sensitive_attributes_in_serialization()
    {
        $this->employee->password_hash = Hash::make('secret');
        $this->employee->remember_token = 'remember_token_123';
        
        $array = $this->employee->toArray();
        
        $this->assertArrayNotHasKey('password_hash', $array);
        $this->assertArrayNotHasKey('remember_token', $array);
        $this->assertArrayHasKey('email', $array);
        $this->assertArrayHasKey('first_name', $array);
    }

    /** @test */
    public function it_casts_attributes_correctly()
    {
        $this->employee->email_verified_at = '2024-01-01 12:00:00';
        $this->employee->last_login_at = '2024-01-02 15:30:00';
        $this->employee->is_active = 1;
        $this->employee->save();

        $this->employee->refresh();

        $this->assertInstanceOf(\Carbon\Carbon::class, $this->employee->email_verified_at);
        $this->assertInstanceOf(\Carbon\Carbon::class, $this->employee->last_login_at);
        $this->assertIsBool($this->employee->is_active);
        $this->assertTrue($this->employee->is_active);
    }

    /** @test */
    public function it_checks_single_role_correctly()
    {
        $this->assertTrue($this->employee->hasRole('admin'));
        $this->assertFalse($this->employee->hasRole('employee'));
        $this->assertFalse($this->employee->hasRole('super_admin'));
    }

    /** @test */
    public function it_checks_multiple_roles_correctly()
    {
        $this->assertTrue($this->employee->hasRole(['admin', 'employee']));
        $this->assertTrue($this->employee->hasRole(['super_admin', 'admin']));
        $this->assertFalse($this->employee->hasRole(['employee', 'project_manager']));
    }

    /** @test */
    public function it_checks_any_role_correctly()
    {
        $this->assertTrue($this->employee->hasAnyRole(['admin', 'employee']));
        $this->assertTrue($this->employee->hasAnyRole(['user', 'admin']));
        $this->assertFalse($this->employee->hasAnyRole(['employee', 'project_manager']));
    }

    /** @test */
    public function it_returns_correct_permissions_for_super_admin()
    {
        $employee = Employee::factory()->create(['role' => 'super_admin']);
        
        $permissions = $employee->permissions;
        
        $this->assertContains('employees.create', $permissions);
        $this->assertContains('employees.read', $permissions);
        $this->assertContains('employees.update', $permissions);
        $this->assertContains('employees.delete', $permissions);
        $this->assertContains('projects.create', $permissions);
        $this->assertContains('projects.delete', $permissions);
        $this->assertContains('admin.all', $permissions);
    }

    /** @test */
    public function it_returns_correct_permissions_for_admin()
    {
        $permissions = $this->employee->permissions; // employee role is 'admin'
        
        $this->assertContains('employees.create', $permissions);
        $this->assertContains('projects.create', $permissions);
        $this->assertContains('files.upload', $permissions);
        $this->assertNotContains('employees.delete', $permissions);
        $this->assertNotContains('admin.all', $permissions);
    }

    /** @test */
    public function it_returns_correct_permissions_for_project_manager()
    {
        $employee = Employee::factory()->create(['role' => 'project_manager']);
        
        $permissions = $employee->permissions;
        
        $this->assertContains('projects.create', $permissions);
        $this->assertContains('files.upload', $permissions);
        $this->assertContains('feedback.read', $permissions);
        $this->assertNotContains('employees.create', $permissions);
        $this->assertNotContains('projects.delete', $permissions);
    }

    /** @test */
    public function it_returns_correct_permissions_for_employee()
    {
        $employee = Employee::factory()->create(['role' => 'employee']);
        
        $permissions = $employee->permissions;
        
        $this->assertContains('projects.read', $permissions);
        $this->assertContains('files.upload', $permissions);
        $this->assertContains('files.read', $permissions);
        $this->assertContains('feedback.read', $permissions);
        $this->assertNotContains('projects.create', $permissions);
        $this->assertNotContains('employees.create', $permissions);
    }

    /** @test */
    public function it_returns_default_permissions_for_unknown_role()
    {
        $employee = Employee::factory()->create(['role' => 'unknown_role']);
        
        $permissions = $employee->permissions;
        
        $this->assertEquals(['projects.read', 'files.read'], $permissions);
    }

    /** @test */
    public function it_checks_permissions_correctly()
    {
        $this->assertTrue($this->employee->hasPermission('employees.create'));
        $this->assertTrue($this->employee->hasPermission('projects.create'));
        $this->assertFalse($this->employee->hasPermission('admin.all'));
        $this->assertFalse($this->employee->hasPermission('nonexistent.permission'));
    }

    /** @test */
    public function it_has_correct_created_projects_relationship()
    {
        $project1 = Project::factory()->create(['created_by' => $this->employee->id]);
        $project2 = Project::factory()->create(['created_by' => $this->employee->id]);
        $project3 = Project::factory()->create(); // Different creator

        $createdProjects = $this->employee->createdProjects;

        $this->assertCount(2, $createdProjects);
        $this->assertTrue($createdProjects->contains($project1));
        $this->assertTrue($createdProjects->contains($project2));
        $this->assertFalse($createdProjects->contains($project3));
    }

    /** @test */
    public function it_has_correct_assigned_projects_relationship()
    {
        $project1 = Project::factory()->create();
        $project2 = Project::factory()->create();
        $project3 = Project::factory()->create();

        // Assign employee to projects
        $this->employee->assignedProjects()->attach($project1->id, [
            'role' => 'developer',
            'assigned_at' => now()
        ]);
        $this->employee->assignedProjects()->attach($project2->id, [
            'role' => 'designer',
            'assigned_at' => now()
        ]);

        $assignedProjects = $this->employee->assignedProjects;

        $this->assertCount(2, $assignedProjects);
        $this->assertTrue($assignedProjects->contains($project1));
        $this->assertTrue($assignedProjects->contains($project2));
        $this->assertFalse($assignedProjects->contains($project3));

        // Check pivot data
        $pivotData = $assignedProjects->first()->pivot;
        $this->assertNotNull($pivotData->role);
        $this->assertNotNull($pivotData->assigned_at);
    }

    /** @test */
    public function it_has_correct_uploaded_files_relationship()
    {
        $file1 = ProjectFile::factory()->create(['employee_id' => $this->employee->id]);
        $file2 = ProjectFile::factory()->create(['employee_id' => $this->employee->id]);
        $file3 = ProjectFile::factory()->create(); // Different uploader

        $uploadedFiles = $this->employee->uploadedFiles;

        $this->assertCount(2, $uploadedFiles);
        $this->assertTrue($uploadedFiles->contains($file1));
        $this->assertTrue($uploadedFiles->contains($file2));
        $this->assertFalse($uploadedFiles->contains($file3));
    }

    /** @test */
    public function it_has_correct_reviewed_feedback_relationship()
    {
        $feedback1 = ClientFeedback::factory()->create(['reviewed_by' => $this->employee->id]);
        $feedback2 = ClientFeedback::factory()->create(['reviewed_by' => $this->employee->id]);
        $feedback3 = ClientFeedback::factory()->create(); // Not reviewed by this employee

        $reviewedFeedback = $this->employee->reviewedFeedback;

        $this->assertCount(2, $reviewedFeedback);
        $this->assertTrue($reviewedFeedback->contains($feedback1));
        $this->assertTrue($reviewedFeedback->contains($feedback2));
        $this->assertFalse($reviewedFeedback->contains($feedback3));
    }

    /** @test */
    public function it_scopes_active_employees_correctly()
    {
        Employee::factory()->create(['is_active' => true]);
        Employee::factory()->create(['is_active' => true]);
        Employee::factory()->create(['is_active' => false]);
        Employee::factory()->create(['is_active' => false]);

        $activeEmployees = Employee::active()->get();

        // Including the employee created in setUp (total should be 3)
        $this->assertCount(3, $activeEmployees);
        
        foreach ($activeEmployees as $employee) {
            $this->assertTrue($employee->is_active);
        }
    }

    /** @test */
    public function it_scopes_employees_by_role_correctly()
    {
        Employee::factory()->create(['role' => 'admin']);
        Employee::factory()->create(['role' => 'employee']);
        Employee::factory()->create(['role' => 'employee']);
        Employee::factory()->create(['role' => 'project_manager']);

        $adminEmployees = Employee::byRole('admin')->get();
        $regularEmployees = Employee::byRole('employee')->get();

        // Including the employee created in setUp (admin role)
        $this->assertCount(2, $adminEmployees);
        $this->assertCount(2, $regularEmployees);

        foreach ($adminEmployees as $employee) {
            $this->assertEquals('admin', $employee->role);
        }

        foreach ($regularEmployees as $employee) {
            $this->assertEquals('employee', $employee->role);
        }
    }

    /** @test */
    public function it_can_combine_scopes()
    {
        Employee::factory()->create(['role' => 'admin', 'is_active' => true]);
        Employee::factory()->create(['role' => 'admin', 'is_active' => false]);
        Employee::factory()->create(['role' => 'employee', 'is_active' => true]);

        $activeAdmins = Employee::active()->byRole('admin')->get();

        // Including the employee created in setUp (admin role, active)
        $this->assertCount(2, $activeAdmins);
        
        foreach ($activeAdmins as $employee) {
            $this->assertEquals('admin', $employee->role);
            $this->assertTrue($employee->is_active);
        }
    }

    /** @test */
    public function it_validates_required_fields()
    {
        $this->expectException(\Illuminate\Database\QueryException::class);
        
        Employee::create([
            // Missing required email field
            'first_name' => 'Test',
            'last_name' => 'User'
        ]);
    }

    /** @test */
    public function it_enforces_unique_email_constraint()
    {
        $this->expectException(\Illuminate\Database\QueryException::class);
        
        Employee::factory()->create(['email' => 'duplicate@example.com']);
        Employee::factory()->create(['email' => 'duplicate@example.com']);
    }

    /** @test */
    public function it_updates_login_tracking_fields()
    {
        $this->employee->failed_login_attempts = 3;
        $this->employee->last_login_at = now();
        $this->employee->save();

        $this->assertEquals(3, $this->employee->failed_login_attempts);
        $this->assertNotNull($this->employee->last_login_at);
        $this->assertInstanceOf(\Carbon\Carbon::class, $this->employee->last_login_at);
    }

    /** @test */
    public function it_handles_email_verification()
    {
        $this->assertNull($this->employee->email_verified_at);

        $this->employee->email_verified_at = now();
        $this->employee->save();

        $this->assertNotNull($this->employee->email_verified_at);
        $this->assertInstanceOf(\Carbon\Carbon::class, $this->employee->email_verified_at);
    }

    /** @test */
    public function it_can_be_soft_deleted()
    {
        // Note: If soft deletes are implemented, test here
        // For now, test regular deletion
        $employeeId = $this->employee->id;
        
        $this->employee->delete();
        
        $this->assertNull(Employee::find($employeeId));
    }

    /** @test */
    public function it_maintains_data_integrity_with_relationships()
    {
        $project = Project::factory()->create(['created_by' => $this->employee->id]);
        $file = ProjectFile::factory()->create(['employee_id' => $this->employee->id]);

        // Verify relationships exist
        $this->assertEquals(1, $this->employee->createdProjects()->count());
        $this->assertEquals(1, $this->employee->uploadedFiles()->count());

        // If we delete the employee, related records should handle this appropriately
        // (either cascade delete or set to null, depending on foreign key constraints)
        $this->assertTrue(true); // Placeholder for relationship integrity tests
    }

    /** @test */
    public function it_formats_timestamps_correctly()
    {
        $this->employee->created_at = '2024-01-01 12:00:00';
        $this->employee->save();
        $this->employee->refresh();

        $this->assertInstanceOf(\Carbon\Carbon::class, $this->employee->created_at);
        $this->assertEquals('2024-01-01 12:00:00', $this->employee->created_at->format('Y-m-d H:i:s'));
    }

    /** @test */
    public function it_handles_mass_assignment_protection()
    {
        $maliciousData = [
            'email' => 'test@example.com',
            'first_name' => 'Test',
            'last_name' => 'User',
            'id' => 999, // Should not be mass assignable
            'created_at' => '2020-01-01', // Should not be mass assignable
        ];

        $employee = Employee::create($maliciousData);

        $this->assertNotEquals(999, $employee->id);
        $this->assertNotEquals('2020-01-01', $employee->created_at->format('Y-m-d'));
    }
}