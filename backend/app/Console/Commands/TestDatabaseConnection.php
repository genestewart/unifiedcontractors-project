<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\DatabaseManager;
use Illuminate\Support\Facades\DB;
use PDO;
use Throwable;

class TestDatabaseConnection extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'db:test-connection {connection?}';

    /**
     * The console command description.
     */
    protected $description = 'Test database connection and PDO configuration for PHP 8.3+ compatibility';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $connectionName = $this->argument('connection') ?: config('database.default');
        
        $this->info("Testing database connection: {$connectionName}");
        
        try {
            // Test basic connection
            $connection = DB::connection($connectionName);
            $pdo = $connection->getPdo();
            
            $this->info("✅ Successfully connected to database");
            $this->info("Database Driver: " . $pdo->getAttribute(PDO::ATTR_DRIVER_NAME));
            $this->info("Server Version: " . $pdo->getAttribute(PDO::ATTR_SERVER_VERSION));
            
            // Test PDO attributes
            $this->testPdoAttributes($pdo);
            
            // Test basic query
            $result = $connection->select('SELECT 1 as test');
            $this->info("✅ Basic query test passed: " . json_encode($result));
            
            return Command::SUCCESS;
            
        } catch (Throwable $e) {
            $this->error("❌ Database connection failed:");
            $this->error("Error: " . $e->getMessage());
            $this->error("File: " . $e->getFile() . ":" . $e->getLine());
            
            if ($e->getPrevious()) {
                $this->error("Previous: " . $e->getPrevious()->getMessage());
            }
            
            return Command::FAILURE;
        }
    }
    
    /**
     * Test PDO attributes for PHP 8.3+ compatibility
     */
    protected function testPdoAttributes(PDO $pdo): void
    {
        $this->info("Testing PDO attributes:");
        
        $testAttributes = [
            'ATTR_CASE' => PDO::ATTR_CASE,
            'ATTR_ERRMODE' => PDO::ATTR_ERRMODE,
            'ATTR_ORACLE_NULLS' => PDO::ATTR_ORACLE_NULLS,
            'ATTR_STRINGIFY_FETCHES' => PDO::ATTR_STRINGIFY_FETCHES,
            'ATTR_EMULATE_PREPARES' => PDO::ATTR_EMULATE_PREPARES,
        ];
        
        foreach ($testAttributes as $name => $attribute) {
            try {
                $value = $pdo->getAttribute($attribute);
                $type = gettype($value);
                $this->info("  ✅ {$name}: {$value} ({$type})");
            } catch (Throwable $e) {
                $this->error("  ❌ {$name}: " . $e->getMessage());
            }
        }
    }
}