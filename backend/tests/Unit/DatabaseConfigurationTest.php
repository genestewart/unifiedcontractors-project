<?php

namespace Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use PDO;
use Tests\TestCase;

class DatabaseConfigurationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that database connections can be established without PHP 8.3+ PDO TypeError
     */
    public function test_database_connection_establishes_without_pdo_type_error(): void
    {
        // Test default connection
        $connection = DB::connection();
        $this->assertInstanceOf(\Illuminate\Database\Connection::class, $connection);
        
        // Test PDO instance can be retrieved
        $pdo = $connection->getPdo();
        $this->assertInstanceOf(PDO::class, $pdo);
    }

    /**
     * Test that all PDO options are properly typed
     */
    public function test_pdo_options_are_properly_typed(): void
    {
        $connections = Config::get('database.connections');
        
        foreach ($connections as $name => $config) {
            if (!isset($config['options'])) {
                continue;
            }
            
            foreach ($config['options'] as $key => $value) {
                // PDO attribute keys must be integers
                $this->assertIsInt($key, 
                    "PDO option key must be integer for connection '{$name}', got: " . gettype($key)
                );
                
                // PDO attribute values should not be string representations of booleans
                $this->assertNotSame('true', $value, 
                    "PDO option value should not be string 'true' for connection '{$name}'"
                );
                $this->assertNotSame('false', $value, 
                    "PDO option value should not be string 'false' for connection '{$name}'"
                );
                
                // Boolean values should be converted to integers for PHP 8.3+ compatibility
                if (is_bool($value)) {
                    $this->fail(
                        "PDO option values should be integers, not booleans for PHP 8.3+ compatibility. " .
                        "Found boolean value for connection '{$name}' key '{$key}'"
                    );
                }
            }
        }
    }
    
    /**
     * Test that MySQL connection can be established with typed PDO options
     */
    public function test_mysql_connection_with_typed_options(): void
    {
        $this->markTestSkipped('MySQL server may not be available in testing environment');
        
        // This test would only run if MySQL is available
        try {
            $connection = DB::connection('mysql');
            $pdo = $connection->getPdo();
            
            // Test that we can retrieve PDO attributes without errors
            $errorMode = $pdo->getAttribute(PDO::ATTR_ERRMODE);
            $this->assertIsInt($errorMode);
            
            $stringifyFetches = $pdo->getAttribute(PDO::ATTR_STRINGIFY_FETCHES);
            $this->assertIsBool($stringifyFetches);
            
        } catch (\Exception $e) {
            $this->markTestSkipped("MySQL connection not available: " . $e->getMessage());
        }
    }
    
    /**
     * Test that SQLite connection works with our configuration
     */
    public function test_sqlite_connection_with_typed_options(): void
    {
        Config::set('database.connections.test_sqlite', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
            'foreign_key_constraints' => true,
            'busy_timeout' => 5000,
            'journal_mode' => 'WAL',
            'synchronous' => 'NORMAL',
            'options' => [
                PDO::ATTR_CASE => PDO::CASE_NATURAL,
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_ORACLE_NULLS => PDO::NULL_NATURAL,
                PDO::ATTR_STRINGIFY_FETCHES => 0, // Integer instead of boolean
                PDO::ATTR_TIMEOUT => 30,
            ],
        ]);
        
        $connection = DB::connection('test_sqlite');
        $pdo = $connection->getPdo();
        
        // Test that PDO attributes are properly set
        $this->assertEquals(PDO::CASE_NATURAL, $pdo->getAttribute(PDO::ATTR_CASE));
        $this->assertEquals(PDO::ERRMODE_EXCEPTION, $pdo->getAttribute(PDO::ATTR_ERRMODE));
        $this->assertEquals(PDO::NULL_NATURAL, $pdo->getAttribute(PDO::ATTR_ORACLE_NULLS));
        
        // Test basic query functionality
        $result = $connection->select('SELECT 1 as test');
        $this->assertCount(1, $result);
        $this->assertEquals(1, $result[0]->test);
    }
    
    /**
     * Test that configuration type casting works correctly
     */
    public function test_database_service_provider_type_casting(): void
    {
        $provider = new \App\Providers\DatabaseServiceProvider($this->app);
        
        // Use reflection to access protected method
        $reflection = new \ReflectionClass($provider);
        $method = $reflection->getMethod('typeCastPdoValue');
        $method->setAccessible(true);
        
        // Test integer attributes
        $this->assertSame(1, $method->invoke($provider, PDO::ATTR_CASE, '1'));
        $this->assertSame(2, $method->invoke($provider, PDO::ATTR_ERRMODE, 2));
        
        // Test boolean attributes (should convert to integers)
        $this->assertSame(1, $method->invoke($provider, PDO::ATTR_STRINGIFY_FETCHES, true));
        $this->assertSame(0, $method->invoke($provider, PDO::ATTR_STRINGIFY_FETCHES, false));
        $this->assertSame(1, $method->invoke($provider, PDO::ATTR_EMULATE_PREPARES, 'true'));
        $this->assertSame(0, $method->invoke($provider, PDO::ATTR_EMULATE_PREPARES, 'false'));
    }
}