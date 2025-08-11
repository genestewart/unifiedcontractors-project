<?php

namespace App\Providers;

use Illuminate\Database\Connection;
use Illuminate\Database\DatabaseManager;
use Illuminate\Support\ServiceProvider;
use PDO;

class DatabaseServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Ensure PDO options are properly typed for PHP 8.3+ compatibility
        $this->ensurePdoOptionsAreTyped();
    }

    /**
     * Ensure all PDO options use proper integer keys and typed values
     * to prevent PHP 8.3+ TypeError issues.
     */
    protected function ensurePdoOptionsAreTyped(): void
    {
        /** @var DatabaseManager $db */
        $db = $this->app['db'];
        
        // Get all database connections configuration
        $connections = config('database.connections', []);
        
        foreach ($connections as $name => $config) {
            if (!isset($config['options']) || !is_array($config['options'])) {
                continue;
            }

            $typedOptions = [];
            
            foreach ($config['options'] as $key => $value) {
                // Ensure the key is a PDO constant (integer)
                if (!is_int($key)) {
                    continue; // Skip invalid keys
                }
                
                // Type cast values appropriately for PHP 8.3+
                $typedOptions[$key] = $this->typeCastPdoValue($key, $value);
            }
            
            // Update the configuration
            config(["database.connections.{$name}.options" => $typedOptions]);
        }
    }

    /**
     * Type cast PDO option values based on the attribute type.
     */
    protected function typeCastPdoValue(int $attribute, mixed $value): mixed
    {
        // These PDO attributes expect integer values
        $integerAttributes = [
            PDO::ATTR_CASE,
            PDO::ATTR_ERRMODE,
            PDO::ATTR_ORACLE_NULLS,
            PDO::ATTR_DEFAULT_FETCH_MODE,
            PDO::ATTR_TIMEOUT,
            PDO::ATTR_AUTOCOMMIT,
            PDO::ATTR_CONNECTION_STATUS,
            PDO::ATTR_PREFETCH,
        ];

        // These PDO attributes expect boolean values (converted to int for PHP 8.3+)
        $booleanAttributes = [
            PDO::ATTR_STRINGIFY_FETCHES,
            PDO::ATTR_EMULATE_PREPARES,
            PDO::ATTR_PERSISTENT,
        ];

        // MySQL-specific attributes that expect strings
        $stringAttributes = [];
        if (extension_loaded('pdo_mysql')) {
            $stringAttributes[] = PDO::MYSQL_ATTR_SSL_CA;
        }

        if (in_array($attribute, $integerAttributes)) {
            return is_numeric($value) ? (int) $value : $value;
        }

        if (in_array($attribute, $booleanAttributes)) {
            // Convert boolean to integer for PHP 8.3+ compatibility
            if (is_bool($value)) {
                return $value ? 1 : 0;
            }
            if ($value === 'true') {
                return 1;
            }
            if ($value === 'false') {
                return 0;
            }
            return is_numeric($value) ? (int) $value : ($value ? 1 : 0);
        }

        if (in_array($attribute, $stringAttributes)) {
            return $value !== null ? (string) $value : null;
        }

        // For unknown attributes, return as-is but ensure it's not a string
        // representation of a boolean or integer
        if (is_string($value)) {
            if ($value === 'true' || $value === '1') {
                return 1;
            }
            if ($value === 'false' || $value === '0') {
                return 0;
            }
            if (is_numeric($value)) {
                return (int) $value;
            }
        }

        return $value;
    }
}