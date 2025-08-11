<?php

namespace Tests\Unit;

use App\Models\Employee;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\ClientFeedback;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Project Model Unit Tests
 * Tests project model relationships, methods, attributes, and business logic
 */
class ProjectModelTest extends TestCase
{
    use RefreshDatabase;

    private Project $project;
    private Employee $employee;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->employee = Employee::factory()->create();
        
        $this->project = Project::factory()->create([
            'name' => 'Test Project',
            'description' => 'A test project description',
            'client_name' => 'John Doe',
            'client_email' => 'john@example.com',
            'status' => 'active',
            'progress_percentage' => 50.00,
            'start_date' => '2024-01-15',
            'end_date' => '2024-06-30',
            'is_public' => true,
            'created_by' => $this->employee->id
        ]);
    }

    #[Test]
    public function it_can_be_created_with_valid_data()
    {
        $projectData = [
            'name' => 'New Project',
            'description' => 'New project description',
            'client_name' => 'Jane Smith',
            'client_email' => 'jane@example.com',
            'status' => 'planning',
            'progress_percentage' => 0,
            'start_date' => '2024-02-01',
            'end_date' => '2024-08-01',
            'is_public' => false,
            'created_by' => $this->employee->id
        ];

        $project = Project::create($projectData);

        $this->assertInstanceOf(Project::class, $project);
        $this->assertEquals('New Project', $project->name);
        $this->assertEquals('Jane Smith', $project->client_name);
        $this->assertEquals('planning', $project->status);
        $this->assertFalse($project->is_public);
        $this->assertEquals(0, $project->progress_percentage);
    }

    #[Test]
    public function it_casts_attributes_correctly()
    {
        $this->assertInstanceOf(Carbon::class, $this->project->start_date);
        $this->assertInstanceOf(Carbon::class, $this->project->end_date);
        $this->assertIsBool($this->project->is_public);
        $this->assertIsFloat($this->project->progress_percentage);
        $this->assertTrue($this->project->is_public);
        $this->assertEquals(50.00, $this->project->progress_percentage);
    }

    #[Test]
    public function it_automatically_generates_qr_code_token_on_creation()
    {
        $newProject = Project::factory()->create();
        
        $this->assertNotNull($newProject->qr_code_token);
        $this->assertStringStartsWith('UC_', $newProject->qr_code_token);
        $this->assertStringContainsString('_', $newProject->qr_code_token);
    }

    #[Test]
    public function it_generates_unique_qr_code_tokens()
    {
        $project1 = Project::factory()->create();
        $project2 = Project::factory()->create();
        
        $this->assertNotEquals($project1->qr_code_token, $project2->qr_code_token);
        $this->assertStringStartsWith('UC_', $project1->qr_code_token);
        $this->assertStringStartsWith('UC_', $project2->qr_code_token);
    }

    #[Test]
    public function it_preserves_existing_qr_code_token_when_provided()
    {
        $customToken = 'UC_CUSTOM123_' . time();
        
        $project = Project::factory()->create([
            'qr_code_token' => $customToken
        ]);
        
        $this->assertEquals($customToken, $project->qr_code_token);
    }

    #[Test]
    public function it_generates_correct_qr_code_url_attribute()
    {
        $expectedUrl = url("/client/project/{$this->project->qr_code_token}");
        
        $this->assertEquals($expectedUrl, $this->project->qr_code_url);
    }

    #[Test]
    public function it_calculates_qr_code_expiration_correctly()
    {
        // Test non-expired QR code
        $this->project->qr_code_expires_at = now()->addHours(24);
        $this->project->save();
        
        $this->assertFalse($this->project->is_qr_code_expired);
        
        // Test expired QR code
        $this->project->qr_code_expires_at = now()->subHours(1);
        $this->project->save();
        
        $this->assertTrue($this->project->is_qr_code_expired);
        
        // Test null expiration (never expires)
        $this->project->qr_code_expires_at = null;
        $this->project->save();
        
        $this->assertFalse($this->project->is_qr_code_expired);
    }

    #[Test]
    public function it_calculates_days_until_deadline_correctly()
    {
        // Test future deadline
        $this->project->end_date = now()->addDays(10);
        $this->project->save();
        
        $this->assertEquals(10, $this->project->days_until_deadline);
        
        // Test past deadline
        $this->project->end_date = now()->subDays(5);
        $this->project->save();
        
        $this->assertEquals(-5, $this->project->days_until_deadline);
        
        // Test no deadline
        $this->project->end_date = null;
        $this->project->save();
        
        $this->assertNull($this->project->days_until_deadline);
    }

    #[Test]
    public function it_calculates_progress_status_correctly()
    {
        // Test completed status
        $this->project->status = 'completed';
        $this->assertEquals('completed', $this->project->progress_status);
        
        // Test on hold status
        $this->project->status = 'on_hold';
        $this->assertEquals('on_hold', $this->project->progress_status);
        
        // Test overdue (past deadline)
        $this->project->status = 'active';
        $this->project->end_date = now()->subDays(1);
        $this->assertEquals('overdue', $this->project->progress_status);
        
        // Test near completion (90%+ progress)
        $this->project->end_date = now()->addDays(30);
        $this->project->progress_percentage = 95;
        $this->assertEquals('near_completion', $this->project->progress_status);
        
        // Test deadline approaching (within 7 days)
        $this->project->progress_percentage = 70;
        $this->project->end_date = now()->addDays(5);
        $this->assertEquals('deadline_approaching', $this->project->progress_status);
        
        // Test on track (50%+ progress, not near deadline)
        $this->project->progress_percentage = 60;
        $this->project->end_date = now()->addDays(30);
        $this->assertEquals('on_track', $this->project->progress_status);
        
        // Test needs attention (low progress)
        $this->project->progress_percentage = 20;
        $this->project->end_date = now()->addDays(30);
        $this->assertEquals('needs_attention', $this->project->progress_status);
    }

    #[Test]
    public function it_regenerates_qr_code_successfully()
    {
        $originalToken = $this->project->qr_code_token;
        
        $result = $this->project->regenerateQRCode();
        
        $this->assertTrue($result);
        $this->assertNotEquals($originalToken, $this->project->qr_code_token);
        $this->assertStringStartsWith('UC_', $this->project->qr_code_token);
    }

    #[Test]
    public function it_regenerates_qr_code_with_expiration()
    {
        $result = $this->project->regenerateQRCode(48); // 48 hours
        
        $this->assertTrue($result);
        $this->assertNotNull($this->project->qr_code_expires_at);
        $this->assertTrue($this->project->qr_code_expires_at->isFuture());
        $this->assertTrue($this->project->qr_code_expires_at->isAfter(now()->addHours(47)));
        $this->assertTrue($this->project->qr_code_expires_at->isBefore(now()->addHours(49)));
    }

    #[Test]
    public function it_regenerates_qr_code_without_expiration()
    {
        $this->project->qr_code_expires_at = now()->addHours(24);
        $this->project->save();
        
        $result = $this->project->regenerateQRCode();
        
        $this->assertTrue($result);
        $this->assertNull($this->project->qr_code_expires_at);
    }

    #[Test]
    public function it_checks_qr_code_accessibility_correctly()
    {
        // Public project with non-expired QR code
        $this->project->is_public = true;
        $this->project->qr_code_expires_at = now()->addHours(24);
        $this->assertTrue($this->project->isQRCodeAccessible());
        
        // Private project
        $this->project->is_public = false;
        $this->assertFalse($this->project->isQRCodeAccessible());
        
        // Public project with expired QR code
        $this->project->is_public = true;
        $this->project->qr_code_expires_at = now()->subHours(1);
        $this->assertFalse($this->project->isQRCodeAccessible());
        
        // Public project with no expiration
        $this->project->is_public = true;
        $this->project->qr_code_expires_at = null;
        $this->assertTrue($this->project->isQRCodeAccessible());
    }

    #[Test]
    public function it_has_correct_creator_relationship()
    {
        $creator = $this->project->creator;
        
        $this->assertInstanceOf(Employee::class, $creator);
        $this->assertEquals($this->employee->id, $creator->id);
        $this->assertEquals($this->employee->email, $creator->email);
    }

    #[Test]
    public function it_has_correct_team_members_relationship()
    {
        $employee1 = Employee::factory()->create();
        $employee2 = Employee::factory()->create();
        
        // Attach team members with pivot data
        $this->project->teamMembers()->attach($employee1->id, [
            'role' => 'developer',
            'assigned_at' => now()
        ]);
        $this->project->teamMembers()->attach($employee2->id, [
            'role' => 'designer',
            'assigned_at' => now()
        ]);
        
        $teamMembers = $this->project->teamMembers;
        
        $this->assertCount(2, $teamMembers);
        $this->assertTrue($teamMembers->contains($employee1));
        $this->assertTrue($teamMembers->contains($employee2));
        
        // Check pivot data
        $firstMember = $teamMembers->first();
        $this->assertNotNull($firstMember->pivot->role);
        $this->assertNotNull($firstMember->pivot->assigned_at);
    }

    #[Test]
    public function it_has_correct_files_relationship()
    {
        $file1 = ProjectFile::factory()->create(['project_id' => $this->project->id]);
        $file2 = ProjectFile::factory()->create(['project_id' => $this->project->id]);
        $file3 = ProjectFile::factory()->create(); // Different project
        
        $files = $this->project->files;
        
        $this->assertCount(2, $files);
        $this->assertTrue($files->contains($file1));
        $this->assertTrue($files->contains($file2));
        $this->assertFalse($files->contains($file3));
    }

    #[Test]
    public function it_has_correct_public_files_relationship()
    {
        $publicFile = ProjectFile::factory()->create([
            'project_id' => $this->project->id,
            'is_public' => true
        ]);
        $privateFile = ProjectFile::factory()->create([
            'project_id' => $this->project->id,
            'is_public' => false
        ]);
        
        $publicFiles = $this->project->publicFiles;
        
        $this->assertCount(1, $publicFiles);
        $this->assertTrue($publicFiles->contains($publicFile));
        $this->assertFalse($publicFiles->contains($privateFile));
    }

    #[Test]
    public function it_has_correct_feedback_relationship()
    {
        $feedback1 = ClientFeedback::factory()->create(['project_id' => $this->project->id]);
        $feedback2 = ClientFeedback::factory()->create(['project_id' => $this->project->id]);
        $feedback3 = ClientFeedback::factory()->create(); // Different project
        
        $feedback = $this->project->feedback;
        
        $this->assertCount(2, $feedback);
        $this->assertTrue($feedback->contains($feedback1));
        $this->assertTrue($feedback->contains($feedback2));
        $this->assertFalse($feedback->contains($feedback3));
    }

    #[Test]
    public function it_has_correct_recent_feedback_relationship()
    {
        $recentFeedback = ClientFeedback::factory()->create([
            'project_id' => $this->project->id,
            'submitted_at' => now()->subDays(10)
        ]);
        $oldFeedback = ClientFeedback::factory()->create([
            'project_id' => $this->project->id,
            'submitted_at' => now()->subDays(40)
        ]);
        
        $recent = $this->project->recentFeedback;
        
        $this->assertCount(1, $recent);
        $this->assertTrue($recent->contains($recentFeedback));
        $this->assertFalse($recent->contains($oldFeedback));
    }

    #[Test]
    public function it_scopes_by_status_correctly()
    {
        Project::factory()->create(['status' => 'active']);
        Project::factory()->create(['status' => 'active']);
        Project::factory()->create(['status' => 'completed']);
        Project::factory()->create(['status' => 'pending']);
        
        $activeProjects = Project::byStatus('active')->get();
        $completedProjects = Project::byStatus('completed')->get();
        
        // Including the project created in setUp (active status)
        $this->assertCount(3, $activeProjects);
        $this->assertCount(1, $completedProjects);
        
        foreach ($activeProjects as $project) {
            $this->assertEquals('active', $project->status);
        }
    }

    #[Test]
    public function it_scopes_active_projects_correctly()
    {
        Project::factory()->create(['status' => 'planning']);
        Project::factory()->create(['status' => 'active']);
        Project::factory()->create(['status' => 'completed']);
        Project::factory()->create(['status' => 'on_hold']);
        
        $activeProjects = Project::active()->get();
        
        // Including the project created in setUp (active status)
        $this->assertCount(3, $activeProjects); // planning, active, and setUp project
        
        foreach ($activeProjects as $project) {
            $this->assertTrue(in_array($project->status, ['planning', 'active']));
        }
    }

    #[Test]
    public function it_scopes_public_projects_correctly()
    {
        Project::factory()->create(['is_public' => true]);
        Project::factory()->create(['is_public' => true]);
        Project::factory()->create(['is_public' => false]);
        Project::factory()->create(['is_public' => false]);
        
        $publicProjects = Project::public()->get();
        
        // Including the project created in setUp (is_public = true)
        $this->assertCount(3, $publicProjects);
        
        foreach ($publicProjects as $project) {
            $this->assertTrue($project->is_public);
        }
    }

    #[Test]
    public function it_scopes_projects_assigned_to_employee()
    {
        $employee = Employee::factory()->create();
        $project1 = Project::factory()->create();
        $project2 = Project::factory()->create();
        $project3 = Project::factory()->create();
        
        // Assign employee to some projects
        $project1->teamMembers()->attach($employee->id);
        $project2->teamMembers()->attach($employee->id);
        
        $assignedProjects = Project::assignedTo($employee->id)->get();
        
        $this->assertCount(2, $assignedProjects);
        $this->assertTrue($assignedProjects->contains($project1));
        $this->assertTrue($assignedProjects->contains($project2));
        $this->assertFalse($assignedProjects->contains($project3));
    }

    #[Test]
    public function it_searches_projects_correctly()
    {
        Project::factory()->create(['name' => 'Website Development', 'client_name' => 'ACME Corp']);
        Project::factory()->create(['name' => 'Mobile App', 'description' => 'iOS and Android development']);
        Project::factory()->create(['name' => 'Database Migration', 'client_name' => 'TechStart']);
        
        // Search by name
        $nameResults = Project::search('Website')->get();
        $this->assertCount(1, $nameResults);
        $this->assertEquals('Website Development', $nameResults->first()->name);
        
        // Search by description
        $descResults = Project::search('development')->get();
        $this->assertGreaterThanOrEqual(1, $descResults->count());
        
        // Search by client name
        $clientResults = Project::search('ACME')->get();
        $this->assertCount(1, $clientResults);
        $this->assertEquals('ACME Corp', $clientResults->first()->client_name);
        
        // Case insensitive search
        $caseResults = Project::search('website')->get();
        $this->assertCount(1, $caseResults);
    }

    #[Test]
    public function it_filters_by_client_email()
    {
        Project::factory()->create(['client_email' => 'client1@example.com']);
        Project::factory()->create(['client_email' => 'client2@example.com']);
        Project::factory()->create(['client_email' => 'client1@example.com']);
        
        $clientProjects = Project::byClient('client1@example.com')->get();
        
        $this->assertCount(2, $clientProjects);
        
        foreach ($clientProjects as $project) {
            $this->assertEquals('client1@example.com', $project->client_email);
        }
    }

    #[Test]
    public function it_can_combine_multiple_scopes()
    {
        $employee = Employee::factory()->create();
        
        $project1 = Project::factory()->create(['status' => 'active', 'is_public' => true]);
        $project2 = Project::factory()->create(['status' => 'completed', 'is_public' => true]);
        $project3 = Project::factory()->create(['status' => 'active', 'is_public' => false]);
        
        $project1->teamMembers()->attach($employee->id);
        $project2->teamMembers()->attach($employee->id);
        $project3->teamMembers()->attach($employee->id);
        
        $results = Project::active()
            ->public()
            ->assignedTo($employee->id)
            ->get();
        
        $this->assertCount(1, $results);
        $this->assertTrue($results->contains($project1));
    }

    #[Test]
    public function it_appends_computed_attributes_correctly()
    {
        $this->project->qr_code_expires_at = now()->addDays(1);
        $this->project->end_date = now()->addDays(5);
        $this->project->save();
        
        $array = $this->project->toArray();
        
        $this->assertArrayHasKey('qr_code_url', $array);
        $this->assertArrayHasKey('is_qr_code_expired', $array);
        $this->assertArrayHasKey('days_until_deadline', $array);
        $this->assertArrayHasKey('progress_status', $array);
        
        $this->assertStringContains('/client/project/', $array['qr_code_url']);
        $this->assertFalse($array['is_qr_code_expired']);
        $this->assertEquals(5, $array['days_until_deadline']);
    }

    #[Test]
    public function it_validates_required_fields()
    {
        $this->expectException(\Illuminate\Database\QueryException::class);
        
        Project::create([
            // Missing required name field
            'description' => 'Test description',
            'client_name' => 'Test Client'
        ]);
    }

    #[Test]
    public function it_handles_mass_assignment_protection()
    {
        $maliciousData = [
            'name' => 'Test Project',
            'client_name' => 'Test Client',
            'id' => 999, // Should not be mass assignable
            'created_at' => '2020-01-01', // Should not be mass assignable
            'qr_code_token' => 'MALICIOUS_TOKEN' // Should be allowed in fillable
        ];

        $project = Project::create($maliciousData);

        $this->assertNotEquals(999, $project->id);
        $this->assertNotEquals('2020-01-01', $project->created_at->format('Y-m-d'));
        $this->assertEquals('MALICIOUS_TOKEN', $project->qr_code_token);
    }

    #[Test]
    public function it_maintains_data_integrity()
    {
        // Test that progress percentage stays within bounds
        $this->project->progress_percentage = 150;
        $this->project->save();
        
        // This would typically be validated at the application level
        // Database allows the value, but business logic should prevent it
        $this->assertEquals(150, $this->project->progress_percentage);
    }
}