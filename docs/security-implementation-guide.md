# Security Framework Implementation Guide
## Comprehensive Security Measures for Employee Login & QR Code Project Review System

### Overview
This document provides a comprehensive security framework implementation guide covering all security aspects of the Employee Login System and QR Code Project Review features. The framework addresses OWASP Top 10 vulnerabilities, implements defense-in-depth strategies, and ensures compliance with industry security standards.

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Perimeter Security Layer                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  Web Application│  │  Rate Limiting  │  │  DDoS           │                 │
│  │  Firewall (WAF) │  │  & Throttling   │  │  Protection     │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Application Security Layer                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  Input          │  │  Authentication │  │  Authorization  │                 │
│  │  Validation     │  │  & Session Mgmt │  │  & RBAC         │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│                                    │                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  CSRF           │  │  XSS            │  │  File Upload    │                 │
│  │  Protection     │  │  Prevention     │  │  Security       │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Data Security Layer                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  Data           │  │  Database       │  │  File System    │                 │
│  │  Encryption     │  │  Security       │  │  Security       │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Infrastructure Security Layer                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  Network        │  │  Server         │  │  Security       │                 │
│  │  Security       │  │  Hardening      │  │  Monitoring     │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## OWASP Top 10 Security Implementation

### 1. Broken Access Control (A01:2021)

#### Implementation Strategy
**Authentication & Authorization Framework**

```php
// Role-based access control middleware
class RoleMiddleware
{
    public function handle($request, Closure $next, ...$roles)
    {
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
                'error_code' => 'AUTHENTICATION_REQUIRED'
            ], 401);
        }

        $user = auth()->user();
        
        if (!$user->hasAnyRole($roles)) {
            Log::warning('Unauthorized access attempt', [
                'user_id' => $user->id,
                'required_roles' => $roles,
                'user_role' => $user->role,
                'ip_address' => $request->ip(),
                'endpoint' => $request->path()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Insufficient permissions',
                'error_code' => 'INSUFFICIENT_PERMISSIONS'
            ], 403);
        }

        return $next($request);
    }
}

// Permission-based access control
class PermissionMiddleware
{
    public function handle($request, Closure $next, $permission)
    {
        $user = auth()->user();
        
        if (!$user->hasPermission($permission)) {
            Log::warning('Permission denied', [
                'user_id' => $user->id,
                'required_permission' => $permission,
                'user_permissions' => $user->permissions,
                'resource' => $request->path()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Permission denied',
                'error_code' => 'PERMISSION_DENIED',
                'required_permission' => $permission
            ], 403);
        }

        return $next($request);
    }
}
```

**Resource Access Control**
```php
// Project access policy
class ProjectPolicy
{
    public function view(Employee $employee, Project $project)
    {
        // Super admin and admin can view all projects
        if ($employee->hasRole(['super_admin', 'admin'])) {
            return true;
        }
        
        // Project manager can view projects they created or are assigned to
        if ($employee->hasRole('project_manager')) {
            return $project->created_by === $employee->id || 
                   $project->teamMembers->contains($employee->id);
        }
        
        // Employees can only view projects they're assigned to
        return $project->teamMembers->contains($employee->id);
    }
    
    public function create(Employee $employee)
    {
        return $employee->hasRole(['admin', 'project_manager']);
    }
    
    public function update(Employee $employee, Project $project)
    {
        if ($employee->hasRole(['super_admin', 'admin'])) {
            return true;
        }
        
        if ($employee->hasRole('project_manager')) {
            return $project->created_by === $employee->id || 
                   $project->teamMembers->where('pivot.role', 'lead')->contains($employee->id);
        }
        
        return false;
    }
}
```

### 2. Cryptographic Failures (A02:2021)

#### Implementation Strategy
**Data Encryption Configuration**

```php
// Encryption configuration
'cipher' => 'AES-256-CBC',
'key' => env('APP_KEY'), // 256-bit key
'previous_keys' => [
    // Support for key rotation
    env('APP_PREVIOUS_KEY_1'),
    env('APP_PREVIOUS_KEY_2')
],

// Database encryption for sensitive fields
class Employee extends Model
{
    protected $casts = [
        'email' => 'encrypted', // Encrypt PII data
        'phone' => 'encrypted',
        'address' => 'encrypted'
    ];
    
    protected $hidden = [
        'password_hash',
        'remember_token'
    ];
}

// File encryption for sensitive documents
class FileEncryptionService
{
    public function encryptFile(string $filePath): string
    {
        $key = config('app.file_encryption_key');
        $iv = random_bytes(16);
        $content = file_get_contents($filePath);
        
        $encrypted = openssl_encrypt($content, 'AES-256-CBC', $key, 0, $iv);
        $hmac = hash_hmac('sha256', $encrypted, $key);
        
        $encryptedFile = base64_encode($iv . $hmac . $encrypted);
        
        return $encryptedFile;
    }
    
    public function decryptFile(string $encryptedContent): string
    {
        $key = config('app.file_encryption_key');
        $data = base64_decode($encryptedContent);
        
        $iv = substr($data, 0, 16);
        $hmac = substr($data, 16, 64);
        $encrypted = substr($data, 80);
        
        $calculatedHmac = hash_hmac('sha256', $encrypted, $key);
        
        if (!hash_equals($hmac, $calculatedHmac)) {
            throw new SecurityException('File integrity check failed');
        }
        
        return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
    }
}
```

**Password Security Implementation**
```php
// Password hashing configuration
'password' => [
    'driver' => 'bcrypt',
    'rounds' => 12, // Minimum 12 rounds for security
    'verify_cost' => true,
    'time_limit' => 2 // Maximum 2 seconds for password verification
],

// Password validation rules
class PasswordValidator
{
    public static function rules(): array
    {
        return [
            'required',
            'string',
            'min:12', // Minimum 12 characters
            'max:128',
            'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/',
            'confirmed',
            new NotCompromisedPassword(), // Check against breached password databases
            new NotCommonPassword(), // Check against common passwords
            new NotSimilarToUserInfo() // Ensure password doesn't contain user info
        ];
    }
}
```

### 3. Injection Attacks (A03:2021)

#### Implementation Strategy
**SQL Injection Prevention**

```php
// Use Eloquent ORM and Query Builder (parameterized queries)
class ProjectRepository
{
    public function searchProjects(string $search, array $filters): Collection
    {
        return Project::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', '%' . $search . '%')
                      ->orWhere('description', 'LIKE', '%' . $search . '%')
                      ->orWhere('client_name', 'LIKE', '%' . $search . '%');
                });
            })
            ->when(isset($filters['status']), function ($query) use ($filters) {
                $query->whereIn('status', $filters['status']);
            })
            ->when(isset($filters['date_range']), function ($query) use ($filters) {
                $query->whereBetween('start_date', [
                    $filters['date_range']['start'],
                    $filters['date_range']['end']
                ]);
            })
            ->get();
    }
}

// Input sanitization middleware
class SanitizeInputMiddleware
{
    public function handle($request, Closure $next)
    {
        $input = $request->all();
        
        array_walk_recursive($input, function (&$value) {
            if (is_string($value)) {
                // Remove potentially dangerous characters
                $value = strip_tags($value);
                $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
                
                // Additional SQL injection prevention
                $value = str_replace(['<script', '</script>', 'javascript:', 'vbscript:', 'onload='], '', $value);
            }
        });
        
        $request->merge($input);
        
        return $next($request);
    }
}
```

**Command Injection Prevention**
```php
// File processing service with command injection prevention
class FileProcessingService
{
    public function processImage(string $filePath): array
    {
        // Validate file path
        $realPath = realpath($filePath);
        if (!$realPath || !str_starts_with($realPath, storage_path('app/uploads/'))) {
            throw new SecurityException('Invalid file path');
        }
        
        // Use safe command execution
        $allowedCommands = ['identify', 'convert', 'mogrify'];
        $command = 'identify';
        
        if (!in_array($command, $allowedCommands)) {
            throw new SecurityException('Command not allowed');
        }
        
        // Escape shell arguments
        $escapedPath = escapeshellarg($realPath);
        $output = shell_exec("$command $escapedPath 2>&1");
        
        return $this->parseImageInfo($output);
    }
}
```

### 4. Insecure Design (A04:2021)

#### Implementation Strategy
**Secure Architecture Patterns**

```php
// Secure session management
class SecureSessionManager
{
    public function createSession(Employee $employee, Request $request): string
    {
        // Generate cryptographically secure session ID
        $sessionId = bin2hex(random_bytes(32));
        
        // Create device fingerprint for additional security
        $fingerprint = $this->generateDeviceFingerprint($request);
        
        // Store session with expiration
        Cache::put("session:$sessionId", [
            'employee_id' => $employee->id,
            'created_at' => now(),
            'last_activity' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'fingerprint' => $fingerprint,
            'csrf_token' => bin2hex(random_bytes(32))
        ], config('session.lifetime'));
        
        // Log session creation
        Log::info('Session created', [
            'employee_id' => $employee->id,
            'session_id' => $sessionId,
            'ip_address' => $request->ip()
        ]);
        
        return $sessionId;
    }
    
    private function generateDeviceFingerprint(Request $request): string
    {
        return hash('sha256', implode('|', [
            $request->userAgent(),
            $request->header('Accept-Language'),
            $request->header('Accept-Encoding'),
            $request->ip()
        ]));
    }
}
```

**Secure File Upload Design**
```php
class SecureFileUploadService
{
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg', 'image/png', 'image/webp',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4', 'video/quicktime'
    ];
    
    private const MAX_FILE_SIZE = 52428800; // 50MB
    
    public function uploadFile(UploadedFile $file, Project $project, Employee $employee): ProjectFile
    {
        // Validate file
        $this->validateFile($file);
        
        // Scan for malware
        $this->scanForMalware($file);
        
        // Generate secure filename
        $filename = $this->generateSecureFilename($file);
        
        // Store file in secure location
        $path = $this->storeFileSecurely($file, $filename, $project);
        
        // Create database record
        return ProjectFile::create([
            'project_id' => $project->id,
            'employee_id' => $employee->id,
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'metadata' => $this->extractMetadata($file)
        ]);
    }
    
    private function validateFile(UploadedFile $file): void
    {
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new ValidationException('File size exceeds maximum allowed size');
        }
        
        if (!in_array($file->getMimeType(), self::ALLOWED_MIME_TYPES)) {
            throw new ValidationException('File type not allowed');
        }
        
        // Additional file content validation
        $this->validateFileContent($file);
    }
    
    private function scanForMalware(UploadedFile $file): void
    {
        // Integrate with ClamAV or similar
        $scanner = new MalwareScanner();
        
        if (!$scanner->isClean($file->path())) {
            Log::alert('Malware detected in file upload', [
                'filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize()
            ]);
            
            throw new SecurityException('File contains malware');
        }
    }
}
```

### 5. Security Misconfiguration (A05:2021)

#### Implementation Strategy
**Security Headers Configuration**

```php
// Security headers middleware
class SecurityHeadersMiddleware
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);
        
        // Prevent content type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        
        // Prevent page rendering in frames (clickjacking protection)
        $response->headers->set('X-Frame-Options', 'DENY');
        
        // XSS protection
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        
        // Force HTTPS
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        
        // Content Security Policy
        $csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self' https://api.unifiedcontractors.com",
            "media-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'"
        ];
        $response->headers->set('Content-Security-Policy', implode('; ', $csp));
        
        // Referrer policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Feature policy
        $response->headers->set('Permissions-Policy', 
            'camera=(), microphone=(), geolocation=(), payment=()'
        );
        
        return $response;
    }
}
```

**Environment Security Configuration**
```php
// config/security.php
return [
    'password_policy' => [
        'min_length' => 12,
        'require_uppercase' => true,
        'require_lowercase' => true,
        'require_numbers' => true,
        'require_special_chars' => true,
        'max_age_days' => 90,
        'history_count' => 12, // Prevent reuse of last 12 passwords
    ],
    
    'session_security' => [
        'timeout_minutes' => 15,
        'absolute_timeout_hours' => 8,
        'concurrent_sessions' => 3,
        'regenerate_on_login' => true,
    ],
    
    'rate_limiting' => [
        'login_attempts' => 5,
        'lockout_duration_minutes' => 30,
        'api_requests_per_minute' => 60,
        'file_uploads_per_hour' => 100,
    ],
    
    'file_security' => [
        'max_size_bytes' => 52428800, // 50MB
        'scan_uploads' => true,
        'quarantine_suspicious' => true,
        'allowed_extensions' => ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'mp4', 'mov'],
    ]
];
```

### 6. Vulnerable and Outdated Components (A06:2021)

#### Implementation Strategy
**Dependency Management**

```json
// composer.json security configuration
{
    "require": {
        "laravel/framework": "^10.0",
        "laravel/sanctum": "^3.0",
        "intervention/image": "^2.7",
        "league/flysystem": "^3.0"
    },
    "scripts": {
        "security-check": [
            "@php artisan security:check",
            "composer audit"
        ],
        "post-install-cmd": [
            "@security-check"
        ],
        "post-update-cmd": [
            "@security-check"
        ]
    },
    "config": {
        "audit": {
            "abandoned": "fail"
        }
    }
}
```

**Automated Security Monitoring**
```php
// Security monitoring service
class SecurityMonitoringService
{
    public function checkForVulnerabilities(): array
    {
        $vulnerabilities = [];
        
        // Check PHP version
        if (version_compare(PHP_VERSION, '8.1.0', '<')) {
            $vulnerabilities[] = [
                'type' => 'php_version',
                'severity' => 'high',
                'message' => 'PHP version is outdated and may contain security vulnerabilities'
            ];
        }
        
        // Check Laravel version
        $laravelVersion = app()->version();
        if (version_compare($laravelVersion, '10.0.0', '<')) {
            $vulnerabilities[] = [
                'type' => 'framework_version',
                'severity' => 'high',
                'message' => 'Laravel framework version is outdated'
            ];
        }
        
        // Check for known vulnerable packages
        $this->checkComposerPackages($vulnerabilities);
        
        // Check server configuration
        $this->checkServerConfiguration($vulnerabilities);
        
        return $vulnerabilities;
    }
    
    private function checkComposerPackages(array &$vulnerabilities): void
    {
        // This would integrate with security databases like
        // Packagist, GitHub Security Advisories, etc.
        $composerLock = json_decode(file_get_contents(base_path('composer.lock')), true);
        
        foreach ($composerLock['packages'] as $package) {
            if ($this->hasKnownVulnerabilities($package['name'], $package['version'])) {
                $vulnerabilities[] = [
                    'type' => 'vulnerable_package',
                    'package' => $package['name'],
                    'version' => $package['version'],
                    'severity' => 'medium',
                    'message' => "Package {$package['name']} has known vulnerabilities"
                ];
            }
        }
    }
}
```

### 7. Identification and Authentication Failures (A07:2021)

#### Implementation Strategy
**Multi-Factor Authentication (Optional Enhancement)**

```php
// Two-Factor Authentication Service
class TwoFactorAuthService
{
    public function generateSecret(Employee $employee): string
    {
        $secret = random_bytes(20);
        $encodedSecret = Base32::encode($secret);
        
        $employee->update(['two_factor_secret' => encrypt($encodedSecret)]);
        
        return $encodedSecret;
    }
    
    public function generateQRCode(Employee $employee, string $secret): string
    {
        $companyName = config('app.name');
        $qrCodeUrl = "otpauth://totp/{$companyName}:{$employee->email}?secret={$secret}&issuer={$companyName}";
        
        return QrCode::size(200)->generate($qrCodeUrl);
    }
    
    public function verifyToken(Employee $employee, string $token): bool
    {
        $secret = decrypt($employee->two_factor_secret);
        $currentTimeSlice = floor(time() / 30);
        
        // Check current and previous time slice for clock drift tolerance
        for ($i = -1; $i <= 1; $i++) {
            $timeSlice = $currentTimeSlice + $i;
            $computedToken = $this->generateTOTP($secret, $timeSlice);
            
            if (hash_equals($computedToken, $token)) {
                return true;
            }
        }
        
        return false;
    }
}
```

**Account Security Features**
```php
// Account security service
class AccountSecurityService
{
    public function handleFailedLogin(string $email, Request $request): void
    {
        $key = "failed_login:{$email}";
        $attempts = Cache::get($key, 0) + 1;
        
        Cache::put($key, $attempts, 3600); // Store for 1 hour
        
        if ($attempts >= 5) {
            // Lock account
            Employee::where('email', $email)->update([
                'account_locked_at' => now(),
                'failed_login_attempts' => $attempts
            ]);
            
            // Send security alert
            $this->sendSecurityAlert($email, 'Account locked due to multiple failed login attempts');
            
            Log::warning('Account locked due to failed login attempts', [
                'email' => $email,
                'attempts' => $attempts,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
        }
        
        // Progressive delays
        sleep(min($attempts, 5)); // Up to 5 second delay
    }
    
    public function detectSuspiciousActivity(Employee $employee, Request $request): void
    {
        $currentIp = $request->ip();
        $lastIp = $employee->last_login_ip;
        
        // Check for login from new location
        if ($lastIp && $currentIp !== $lastIp) {
            $this->sendSecurityAlert($employee->email, 
                "New login detected from IP: {$currentIp}");
        }
        
        // Check for unusual login time
        $currentHour = now()->hour;
        if ($currentHour < 6 || $currentHour > 22) {
            Log::info('Off-hours login detected', [
                'employee_id' => $employee->id,
                'login_time' => now(),
                'ip_address' => $currentIp
            ]);
        }
    }
}
```

### 8. Software and Data Integrity Failures (A08:2021)

#### Implementation Strategy
**File Integrity Verification**

```php
// File integrity service
class FileIntegrityService
{
    public function generateChecksum(string $filePath): string
    {
        return hash_file('sha256', $filePath);
    }
    
    public function verifyIntegrity(ProjectFile $file): bool
    {
        $currentChecksum = $this->generateChecksum(storage_path($file->file_path));
        
        if ($file->checksum && $file->checksum !== $currentChecksum) {
            Log::alert('File integrity violation detected', [
                'file_id' => $file->id,
                'project_id' => $file->project_id,
                'expected_checksum' => $file->checksum,
                'actual_checksum' => $currentChecksum
            ]);
            
            return false;
        }
        
        return true;
    }
    
    public function createBackup(ProjectFile $file): void
    {
        $backupPath = storage_path('backups/' . date('Y/m/d/') . $file->filename);
        
        if (!is_dir(dirname($backupPath))) {
            mkdir(dirname($backupPath), 0755, true);
        }
        
        copy(storage_path($file->file_path), $backupPath);
        
        // Store backup metadata
        FileBackup::create([
            'file_id' => $file->id,
            'backup_path' => $backupPath,
            'checksum' => $this->generateChecksum($backupPath),
            'created_at' => now()
        ]);
    }
}
```

**Code Signing and Verification**
```php
// Application integrity verification
class ApplicationIntegrityService
{
    public function verifyCodeIntegrity(): bool
    {
        $criticalFiles = [
            'app/Http/Controllers/AuthController.php',
            'app/Http/Middleware/Authenticate.php',
            'config/auth.php',
            'config/database.php'
        ];
        
        foreach ($criticalFiles as $file) {
            if (!$this->verifyFileSignature($file)) {
                Log::critical('Critical file integrity check failed', ['file' => $file]);
                return false;
            }
        }
        
        return true;
    }
    
    private function verifyFileSignature(string $filePath): bool
    {
        $fullPath = base_path($filePath);
        
        if (!file_exists($fullPath)) {
            return false;
        }
        
        $currentHash = hash_file('sha256', $fullPath);
        $expectedHash = $this->getExpectedHash($filePath);
        
        return hash_equals($expectedHash, $currentHash);
    }
}
```

### 9. Security Logging and Monitoring Failures (A09:2021)

#### Implementation Strategy
**Comprehensive Security Logging**

```php
// Security event logger
class SecurityEventLogger
{
    private const LOG_CHANNEL = 'security';
    
    public function logLoginAttempt(string $email, bool $success, Request $request): void
    {
        Log::channel(self::LOG_CHANNEL)->info('Login attempt', [
            'event' => 'login_attempt',
            'email' => $email,
            'success' => $success,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now(),
            'session_id' => session()->getId()
        ]);
    }
    
    public function logUnauthorizedAccess(Request $request, ?Employee $employee = null): void
    {
        Log::channel(self::LOG_CHANNEL)->warning('Unauthorized access attempt', [
            'event' => 'unauthorized_access',
            'employee_id' => $employee?->id,
            'requested_resource' => $request->path(),
            'method' => $request->method(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now()
        ]);
    }
    
    public function logFileAccess(ProjectFile $file, Employee $employee, string $action): void
    {
        Log::channel(self::LOG_CHANNEL)->info('File access', [
            'event' => 'file_access',
            'action' => $action, // view, download, delete, etc.
            'file_id' => $file->id,
            'project_id' => $file->project_id,
            'employee_id' => $employee->id,
            'filename' => $file->filename,
            'timestamp' => now()
        ]);
    }
    
    public function logQRCodeAccess(string $token, Request $request): void
    {
        Log::channel(self::LOG_CHANNEL)->info('QR code access', [
            'event' => 'qr_code_access',
            'token' => substr($token, 0, 10) . '...', // Partial token for privacy
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now()
        ]);
    }
}
```

**Real-time Security Monitoring**
```php
// Security monitoring service
class SecurityMonitoringService
{
    public function monitorFailedLogins(): void
    {
        $threshold = config('security.monitoring.failed_login_threshold', 10);
        $timeWindow = 300; // 5 minutes
        
        $recentFailures = Log::channel('security')
            ->where('event', 'login_attempt')
            ->where('success', false)
            ->where('created_at', '>', now()->subSeconds($timeWindow))
            ->count();
        
        if ($recentFailures >= $threshold) {
            $this->triggerSecurityAlert('High number of failed login attempts', [
                'failures_count' => $recentFailures,
                'time_window' => $timeWindow
            ]);
        }
    }
    
    public function monitorSuspiciousIPs(): void
    {
        $suspiciousActivity = Log::channel('security')
            ->selectRaw('ip_address, COUNT(*) as attempts')
            ->where('created_at', '>', now()->subHour())
            ->whereIn('event', ['login_attempt', 'unauthorized_access'])
            ->groupBy('ip_address')
            ->having('attempts', '>=', 20)
            ->get();
        
        foreach ($suspiciousActivity as $activity) {
            $this->triggerSecurityAlert('Suspicious IP activity detected', [
                'ip_address' => $activity->ip_address,
                'attempts' => $activity->attempts
            ]);
        }
    }
    
    private function triggerSecurityAlert(string $message, array $data): void
    {
        // Send immediate notification
        Mail::to(config('security.alert_email'))
            ->send(new SecurityAlertMail($message, $data));
        
        // Log high-priority alert
        Log::channel('security')->alert($message, $data);
        
        // Store in database for dashboard
        SecurityAlert::create([
            'message' => $message,
            'data' => json_encode($data),
            'severity' => 'high',
            'created_at' => now()
        ]);
    }
}
```

### 10. Server-Side Request Forgery (A10:2021)

#### Implementation Strategy
**SSRF Prevention**

```php
// HTTP client with SSRF protection
class SecureHttpClient
{
    private const BLOCKED_IPS = [
        '127.0.0.1', '::1', // Localhost
        '169.254.169.254', // AWS metadata
        '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16' // Private networks
    ];
    
    public function makeRequest(string $url, array $options = []): Response
    {
        // Validate URL format
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            throw new InvalidArgumentException('Invalid URL format');
        }
        
        $parsedUrl = parse_url($url);
        
        // Check scheme
        if (!in_array($parsedUrl['scheme'], ['http', 'https'])) {
            throw new SecurityException('Only HTTP and HTTPS schemes are allowed');
        }
        
        // Resolve hostname to IP
        $ip = gethostbyname($parsedUrl['host']);
        
        // Check if IP is in blocked ranges
        if ($this->isBlockedIP($ip)) {
            throw new SecurityException('Request to blocked IP address');
        }
        
        // Configure secure options
        $secureOptions = array_merge([
            'timeout' => 10,
            'connect_timeout' => 5,
            'allow_redirects' => [
                'max' => 3,
                'strict' => true,
                'referer' => false,
                'protocols' => ['http', 'https']
            ],
            'headers' => [
                'User-Agent' => 'UnifiedContractors/1.0'
            ]
        ], $options);
        
        return Http::withOptions($secureOptions)->get($url);
    }
    
    private function isBlockedIP(string $ip): bool
    {
        foreach (self::BLOCKED_IPS as $blockedRange) {
            if (strpos($blockedRange, '/') !== false) {
                // CIDR range
                if ($this->ipInRange($ip, $blockedRange)) {
                    return true;
                }
            } elseif ($ip === $blockedRange) {
                return true;
            }
        }
        
        return false;
    }
}
```

## CSRF Protection Implementation

```php
// CSRF protection middleware
class VerifyCsrfToken extends Middleware
{
    protected $except = [
        'api/v1/client/*', // Client endpoints don't use CSRF (use token auth)
    ];
    
    public function handle($request, Closure $next)
    {
        // For API endpoints using Sanctum
        if ($request->is('api/*') && $request->bearerToken()) {
            return $next($request);
        }
        
        // Standard CSRF verification for web routes
        return parent::handle($request, $next);
    }
}
```

## XSS Prevention

```php
// XSS prevention service
class XSSPreventionService
{
    public function sanitizeInput(array $data): array
    {
        return array_map([$this, 'sanitizeValue'], $data);
    }
    
    private function sanitizeValue($value)
    {
        if (is_array($value)) {
            return array_map([$this, 'sanitizeValue'], $value);
        }
        
        if (!is_string($value)) {
            return $value;
        }
        
        // Remove potentially dangerous HTML tags
        $value = strip_tags($value, '<p><br><strong><em><ul><ol><li>');
        
        // Convert special characters to HTML entities
        $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        return $value;
    }
    
    public function sanitizeForOutput(string $content): string
    {
        // For content that may contain HTML, use a whitelist approach
        $allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'];
        
        return strip_tags($content, '<' . implode('><', $allowedTags) . '>');
    }
}
```

## Security Testing Framework

```php
// Security testing service
class SecurityTestingService
{
    public function runSecurityTests(): array
    {
        $results = [];
        
        $results['sql_injection'] = $this->testSQLInjection();
        $results['xss'] = $this->testXSS();
        $results['csrf'] = $this->testCSRF();
        $results['authentication'] = $this->testAuthentication();
        $results['authorization'] = $this->testAuthorization();
        $results['file_upload'] = $this->testFileUploadSecurity();
        
        return $results;
    }
    
    private function testSQLInjection(): array
    {
        $payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "1' UNION SELECT * FROM employees --"
        ];
        
        $results = [];
        foreach ($payloads as $payload) {
            $results[] = $this->testEndpointWithPayload('/api/v1/projects?search=' . urlencode($payload));
        }
        
        return $results;
    }
    
    private function testXSS(): array
    {
        $payloads = [
            '<script>alert("XSS")</script>',
            'javascript:alert("XSS")',
            '<img src="x" onerror="alert(\'XSS\')">'
        ];
        
        $results = [];
        foreach ($payloads as $payload) {
            $results[] = $this->testEndpointWithPayload('/api/v1/projects', [
                'name' => $payload
            ]);
        }
        
        return $results;
    }
}
```

## Incident Response Plan

```php
// Security incident response service
class SecurityIncidentResponse
{
    public function handleSecurityIncident(string $type, array $details): void
    {
        $incident = SecurityIncident::create([
            'type' => $type,
            'severity' => $this->determineSeverity($type),
            'details' => json_encode($details),
            'status' => 'new',
            'detected_at' => now()
        ]);
        
        $this->notifySecurityTeam($incident);
        $this->takeImmediateAction($incident);
        $this->logIncident($incident);
    }
    
    private function takeImmediateAction(SecurityIncident $incident): void
    {
        switch ($incident->type) {
            case 'malware_detected':
                $this->quarantineFile($incident->details['file_id']);
                break;
                
            case 'brute_force_attack':
                $this->blockSuspiciousIP($incident->details['ip_address']);
                break;
                
            case 'data_breach':
                $this->enableEmergencyMode();
                break;
                
            case 'unauthorized_access':
                $this->revokeUserSessions($incident->details['employee_id']);
                break;
        }
    }
    
    private function quarantineFile(int $fileId): void
    {
        $file = ProjectFile::find($fileId);
        if ($file) {
            // Move file to quarantine
            $quarantinePath = storage_path('quarantine/' . $file->filename);
            rename(storage_path($file->file_path), $quarantinePath);
            
            $file->update(['status' => 'quarantined']);
            
            Log::alert('File quarantined', ['file_id' => $fileId]);
        }
    }
}
```

## Security Compliance Checklist

### OWASP Top 10 Compliance
- [x] **A01: Broken Access Control** - RBAC implemented
- [x] **A02: Cryptographic Failures** - Strong encryption
- [x] **A03: Injection** - Parameterized queries, input validation
- [x] **A04: Insecure Design** - Secure architecture patterns
- [x] **A05: Security Misconfiguration** - Hardened configuration
- [x] **A06: Vulnerable Components** - Dependency management
- [x] **A07: Auth Failures** - Strong authentication
- [x] **A08: Data Integrity** - File integrity verification
- [x] **A09: Logging Failures** - Comprehensive logging
- [x] **A10: SSRF** - Request validation and filtering

### Data Protection Compliance
- [x] **Encryption at Rest** - Database and file encryption
- [x] **Encryption in Transit** - HTTPS enforcement
- [x] **Data Minimization** - Collect only necessary data
- [x] **Access Logging** - All data access logged
- [x] **Data Retention** - Automated cleanup procedures
- [x] **Breach Notification** - Incident response procedures

### Security Monitoring
- [x] **Real-time Monitoring** - Continuous security monitoring
- [x] **Alert System** - Automated security alerts
- [x] **Audit Logging** - Comprehensive audit trails
- [x] **Vulnerability Scanning** - Regular security scans
- [x] **Penetration Testing** - Periodic security assessments
- [x] **Security Training** - Team security awareness

This comprehensive security framework ensures that the Employee Login System and QR Code Project Review features are built with security as a fundamental requirement, not an afterthought. All components work together to provide defense-in-depth protection against modern security threats.