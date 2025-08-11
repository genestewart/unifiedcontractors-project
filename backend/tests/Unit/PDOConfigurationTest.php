<?php

namespace Tests\Unit;

use Illuminate\Support\Facades\Config;
use PDO;
use Tests\TestCase;

class PDOConfigurationTest extends TestCase
{
    /**
     * Test that all PDO options in database configuration are properly typed for PHP 8.3+
     */
    public function test_pdo_options_are_properly_typed(): void
    {
        // Get database configuration
        $connections = config('database.connections', []);
        
        $this->assertNotEmpty($connections, 'Database connections should be configured');
        
        foreach ($connections as $name => $config) {
            if (!isset($config['options']) || !is_array($config['options'])) {
                continue; // Skip connections without options
            }
            
            foreach ($config['options'] as $key => $value) {
                // PDO attribute keys must be integers (PDO constants)
                $this->assertIsInt($key, 
                    "PDO option key must be integer for connection '{$name}', got: " . gettype($key) . " with value: " . var_export($key, true)
                );
                
                // PDO attribute values should not be string representations of booleans
                $this->assertNotSame('true', $value, 
                    "PDO option value should not be string 'true' for connection '{$name}' key '{$key}'"
                );
                $this->assertNotSame('false', $value, 
                    "PDO option value should not be string 'false' for connection '{$name}' key '{$key}'"
                );
                
                // For boolean-type PDO attributes, values should be integers in PHP 8.3+
                $booleanAttributes = [
                    PDO::ATTR_STRINGIFY_FETCHES,
                    PDO::ATTR_EMULATE_PREPARES,
                ];
                
                if (in_array($key, $booleanAttributes) && is_bool($value)) {
                    $this->fail(
                        "PDO boolean attribute values should be integers (0 or 1) for PHP 8.3+ compatibility. " .
                        "Found boolean value for connection '{$name}' key '{$key}'. " .
                        "Use 0 instead of false, 1 instead of true."
                    );
                }
            }
        }
    }
    
    /**
     * Test that our DatabaseServiceProvider type casting works correctly
     */
    public function test_database_service_provider_type_casting(): void
    {
        $provider = new \App\Providers\DatabaseServiceProvider(app());
        
        // Use reflection to access protected method
        $reflection = new \ReflectionClass($provider);
        $method = $reflection->getMethod('typeCastPdoValue');
        $method->setAccessible(true);
        
        // Test integer attributes
        $this->assertSame(1, $method->invoke($provider, PDO::ATTR_CASE, '1'));
        $this->assertSame(2, $method->invoke($provider, PDO::ATTR_ERRMODE, 2));
        $this->assertSame(30, $method->invoke($provider, PDO::ATTR_TIMEOUT, '30'));
        
        // Test boolean attributes (should convert to integers)
        $this->assertSame(1, $method->invoke($provider, PDO::ATTR_STRINGIFY_FETCHES, true));
        $this->assertSame(0, $method->invoke($provider, PDO::ATTR_STRINGIFY_FETCHES, false));
        $this->assertSame(1, $method->invoke($provider, PDO::ATTR_EMULATE_PREPARES, 'true'));
        $this->assertSame(0, $method->invoke($provider, PDO::ATTR_EMULATE_PREPARES, 'false'));
        $this->assertSame(1, $method->invoke($provider, PDO::ATTR_EMULATE_PREPARES, '1'));
        $this->assertSame(0, $method->invoke($provider, PDO::ATTR_EMULATE_PREPARES, '0'));
        
        // Test string values for unknown attributes
        $unknownAttribute = 99999; // Non-existent PDO attribute
        $this->assertSame(1, $method->invoke($provider, $unknownAttribute, 'true'));
        $this->assertSame(0, $method->invoke($provider, $unknownAttribute, 'false'));
        $this->assertSame(42, $method->invoke($provider, $unknownAttribute, '42'));
        $this->assertSame('test', $method->invoke($provider, $unknownAttribute, 'test'));
    }
    
    /**
     * Test that specific database connection configurations are valid
     */
    public function test_specific_connection_configurations(): void
    {
        $connections = config('database.connections');
        
        // Test MySQL configuration
        if (isset($connections['mysql']['options'])) {
            $mysqlOptions = $connections['mysql']['options'];
            foreach ($mysqlOptions as $key => $value) {
                $this->assertIsInt($key, 'MySQL PDO option keys must be integers');
                if ($key === PDO::ATTR_STRINGIFY_FETCHES || $key === PDO::ATTR_EMULATE_PREPARES) {
                    $this->assertTrue(
                        is_int($value) || is_null($value),
                        "MySQL PDO boolean attributes should be integers or null, got " . gettype($value)
                    );
                }
            }
        }
        
        // Test SQLite configuration
        if (isset($connections['sqlite']['options'])) {
            $sqliteOptions = $connections['sqlite']['options'];
            foreach ($sqliteOptions as $key => $value) {
                $this->assertIsInt($key, 'SQLite PDO option keys must be integers');
                if ($key === PDO::ATTR_STRINGIFY_FETCHES || $key === PDO::ATTR_EMULATE_PREPARES) {
                    $this->assertTrue(
                        is_int($value) || is_null($value),
                        "SQLite PDO boolean attributes should be integers or null, got " . gettype($value)
                    );
                }
            }
        }
    }
    
    /**
     * Test that PDO options don't contain invalid values that would cause PHP 8.3+ errors
     */
    public function test_pdo_options_php83_compatibility(): void
    {
        $connections = config('database.connections');
        
        foreach ($connections as $connectionName => $config) {
            if (!isset($config['options'])) {
                continue;
            }
            
            foreach ($config['options'] as $attribute => $value) {
                // Check for common problematic values
                $this->assertNotSame('1', $value, 
                    "PDO attribute values should not be string '1' for connection '{$connectionName}'"
                );
                $this->assertNotSame('0', $value, 
                    "PDO attribute values should not be string '0' for connection '{$connectionName}'"
                );
                
                // If it's a numeric string, it should be converted to int
                if (is_string($value) && is_numeric($value)) {
                    $this->fail(
                        "Numeric PDO attribute values should be integers, not strings. " .
                        "Found string '{$value}' for connection '{$connectionName}' attribute '{$attribute}'"
                    );
                }
            }
        }
    }
}