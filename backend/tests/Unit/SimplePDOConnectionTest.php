<?php

namespace Tests\Unit;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use PDO;
use Tests\TestCase;

class SimplePDOConnectionTest extends TestCase
{
    /**
     * Test that a simple database connection can be established without PDO TypeError
     */
    public function test_database_connection_without_pdo_type_error(): void
    {
        // Configure SQLite in-memory database to avoid external dependencies
        Config::set('database.connections.test_connection', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
            'foreign_key_constraints' => true,
            'options' => [
                PDO::ATTR_CASE => PDO::CASE_NATURAL,
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_ORACLE_NULLS => PDO::NULL_NATURAL,
                PDO::ATTR_STRINGIFY_FETCHES => 0, // Integer instead of boolean
                PDO::ATTR_EMULATE_PREPARES => 0,  // Integer instead of boolean
                PDO::ATTR_TIMEOUT => 30,          // Integer value
            ],
        ]);
        
        // This should not throw a PDO TypeError in PHP 8.3+
        $connection = DB::connection('test_connection');
        
        // Verify we have a valid connection
        $this->assertNotNull($connection);
        
        // Verify we can get a PDO instance
        $pdo = $connection->getPdo();
        $this->assertInstanceOf(PDO::class, $pdo);
        
        // Verify PDO attributes are properly set
        $this->assertEquals(PDO::CASE_NATURAL, $pdo->getAttribute(PDO::ATTR_CASE));
        $this->assertEquals(PDO::ERRMODE_EXCEPTION, $pdo->getAttribute(PDO::ATTR_ERRMODE));
        $this->assertEquals(PDO::NULL_NATURAL, $pdo->getAttribute(PDO::ATTR_ORACLE_NULLS));
        
        // Test a simple query to ensure the connection works
        $result = $connection->select('SELECT 1 as test_value');
        $this->assertNotEmpty($result);
        $this->assertEquals(1, $result[0]->test_value);
    }
    
    /**
     * Test that the MySQL configuration would work (if MySQL were available)
     */
    public function test_mysql_configuration_is_valid(): void
    {
        $mysqlConfig = config('database.connections.mysql');
        
        // Verify the configuration exists
        $this->assertIsArray($mysqlConfig);
        $this->assertEquals('mysql', $mysqlConfig['driver']);
        
        // Verify PDO options are properly typed
        if (isset($mysqlConfig['options'])) {
            foreach ($mysqlConfig['options'] as $key => $value) {
                $this->assertIsInt($key, 'MySQL PDO attribute keys must be integers');
                
                // Boolean attributes should be integers
                if ($key === PDO::ATTR_STRINGIFY_FETCHES || $key === PDO::ATTR_EMULATE_PREPARES) {
                    $this->assertTrue(
                        is_int($value) || is_null($value),
                        "Boolean PDO attributes should be integers or null for PHP 8.3+ compatibility"
                    );
                }
            }
        }
    }
    
    /**
     * Test that PostgreSQL configuration is valid
     */
    public function test_postgresql_configuration_is_valid(): void
    {
        $pgsqlConfig = config('database.connections.pgsql');
        
        // Verify the configuration exists
        $this->assertIsArray($pgsqlConfig);
        $this->assertEquals('pgsql', $pgsqlConfig['driver']);
        $this->assertIsInt($pgsqlConfig['port']); // Should be cast to int
        
        // Verify PDO options are properly typed
        if (isset($pgsqlConfig['options'])) {
            foreach ($pgsqlConfig['options'] as $key => $value) {
                $this->assertIsInt($key, 'PostgreSQL PDO attribute keys must be integers');
            }
        }
    }
}