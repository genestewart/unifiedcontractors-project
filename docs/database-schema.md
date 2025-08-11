# Database Schema Design
## Employee Login System & QR Code Project Review

### Overview
This document defines the complete database schema for the Employee Login System and QR Code Project Review features. The schema is designed for MySQL 8.0+ with optimal performance, security, and scalability considerations.

## Entity Relationship Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   employees     │    │ project_employees│    │     projects        │
├─────────────────┤    ├──────────────────┤    ├─────────────────────┤
│ id (PK)         │◄──┐│ employee_id (FK) │┌──►│ id (PK)             │
│ email (UNIQUE)  │   ││ project_id (FK)  ││   │ name                │
│ password_hash   │   ││ role             ││   │ description         │
│ first_name      │   ││ assigned_at      ││   │ client_name         │
│ last_name       │   │└──────────────────┘│   │ client_email        │
│ role            │   │                    │   │ status              │
│ is_active       │   │                    │   │ progress_percentage │
│ last_login_at   │   │                    │   │ start_date          │
│ failed_login_   │   │                    │   │ end_date            │
│   attempts      │   │                    │   │ qr_code_token       │
│ email_verified_ │   │                    │   │ qr_code_expires_at  │
│   at            │   │                    │   │ is_public           │
│ created_at      │   │                    │   │ created_by (FK)     │──┐
│ updated_at      │   │                    │   │ created_at          │  │
└─────────────────┘   │                    │   │ updated_at          │  │
                      │                    │   └─────────────────────┘  │
┌─────────────────────┴────────────────────┴───────────────────────────┘
│
▼
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   project_files     │    │   client_feedback    │    │ password_resets │
├─────────────────────┤    ├──────────────────────┤    ├─────────────────┤
│ id (PK)             │    │ id (PK)              │    │ email           │
│ project_id (FK)     │──┐ │ project_id (FK)      │──┐ │ token (UNIQUE)  │
│ employee_id (FK)    │  │ │ file_id (FK,NULL)    │  │ │ expires_at      │
│ filename            │  │ │ feedback_text        │  │ │ created_at      │
│ original_filename   │  │ │ rating (1-5)         │  │ └─────────────────┘
│ file_path           │  │ │ status               │  │
│ file_size           │  │ │ client_email         │  │
│ mime_type           │  │ │ submitted_at         │  │
│ category            │  │ │ reviewed_at          │  │
│ description         │  │ │ reviewed_by (FK)     │──┘
│ metadata (JSON)     │  │ │ created_at           │
│ is_public           │  │ │ updated_at           │
│ sort_order          │  │ └──────────────────────┘
│ uploaded_at         │  │
│ updated_at          │  │
└─────────────────────┘  │
         ▲               │
         └───────────────┘
```

## Table Definitions

### employees
**Purpose**: Store employee authentication and profile information with role-based access control.

```sql
CREATE TABLE employees (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('employee', 'project_manager', 'admin', 'super_admin') DEFAULT 'employee',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    failed_login_attempts TINYINT UNSIGNED DEFAULT 0,
    email_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active),
    INDEX idx_last_login (last_login_at)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Features**:
- Email-based authentication with unique constraint
- Role hierarchy: employee < project_manager < admin < super_admin
- Account lockout tracking with `failed_login_attempts`
- Email verification support
- Soft account deactivation with `is_active`

### projects
**Purpose**: Store project information with QR code access tokens and client details.

```sql
CREATE TABLE projects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    status ENUM('planning', 'active', 'on_hold', 'completed', 'archived') DEFAULT 'planning',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    qr_code_token VARCHAR(255) NOT NULL UNIQUE,
    qr_code_expires_at TIMESTAMP NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_client_email (client_email),
    INDEX idx_status (status),
    INDEX idx_qr_token (qr_code_token),
    INDEX idx_created_by (created_by),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_public (is_public),
    
    FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE RESTRICT,
    
    CONSTRAINT chk_progress_range CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    CONSTRAINT chk_date_order CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Features**:
- Unique QR code tokens with optional expiration
- Progress tracking with percentage constraints
- Project lifecycle status management
- Client information integration
- Public/private project visibility control

### project_employees
**Purpose**: Many-to-many relationship between employees and projects with role assignments.

```sql
CREATE TABLE project_employees (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    role ENUM('lead', 'contributor', 'viewer') DEFAULT 'contributor',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_project_employee (project_id, employee_id),
    INDEX idx_project (project_id),
    INDEX idx_employee (employee_id),
    INDEX idx_role (role),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Features**:
- Project-specific role assignments
- Unique constraint prevents duplicate assignments
- Cascading deletes maintain referential integrity

### project_files
**Purpose**: Store file metadata and organization information for project assets.

```sql
CREATE TABLE project_files (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    category ENUM('image', 'document', 'video', 'blueprint', 'other') DEFAULT 'other',
    description TEXT,
    metadata JSON,
    is_public BOOLEAN DEFAULT FALSE,
    sort_order INT UNSIGNED DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_project (project_id),
    INDEX idx_employee (employee_id),
    INDEX idx_category (category),
    INDEX idx_mime_type (mime_type),
    INDEX idx_public (is_public),
    INDEX idx_sort_order (sort_order),
    INDEX idx_uploaded_at (uploaded_at),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    
    CONSTRAINT chk_file_size CHECK (file_size > 0 AND file_size <= 52428800) -- 50MB limit
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Features**:
- Comprehensive file metadata storage
- File categorization and organization
- JSON metadata field for extensible attributes
- Sort ordering for custom file arrangement
- File size constraints (50MB limit)

### client_feedback
**Purpose**: Store client feedback, ratings, and communication for projects.

```sql
CREATE TABLE client_feedback (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    file_id BIGINT UNSIGNED NULL,
    feedback_text TEXT NOT NULL,
    rating TINYINT UNSIGNED NULL,
    status ENUM('new', 'reviewed', 'in_progress', 'resolved') DEFAULT 'new',
    client_email VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_project (project_id),
    INDEX idx_file (file_id),
    INDEX idx_status (status),
    INDEX idx_client_email (client_email),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_reviewed_by (reviewed_by),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES project_files(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES employees(id) ON DELETE SET NULL,
    
    CONSTRAINT chk_rating_range CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Features**:
- Optional file-specific feedback
- 1-5 star rating system
- Feedback workflow status tracking
- Employee review assignment
- Client email integration

### password_resets
**Purpose**: Secure password reset token management.

```sql
CREATE TABLE password_resets (
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Features**:
- Secure token-based password reset
- Token expiration management
- Email-based lookup

## Performance Optimizations

### Index Strategy
1. **Primary Keys**: All tables use `BIGINT UNSIGNED AUTO_INCREMENT` for scalability
2. **Foreign Key Indexes**: All foreign key columns have corresponding indexes
3. **Query Optimization**: Indexes on frequently queried columns (email, status, dates)
4. **Composite Indexes**: Multi-column indexes for complex query patterns

### Query Performance Targets
- Employee login: < 50ms
- Project listing: < 100ms
- File gallery: < 200ms
- Client QR access: < 150ms

### Storage Estimates
- **employees**: ~2KB per record
- **projects**: ~5KB per record
- **project_files**: ~1KB per record (excluding actual files)
- **client_feedback**: ~3KB per record

**Initial 50 users, 500 projects estimate**: ~2.5MB database size

## Data Integrity Constraints

### Business Rules Enforced
1. **Email Uniqueness**: Prevents duplicate employee accounts
2. **Progress Range**: Project progress between 0-100%
3. **Date Logic**: End dates must be after start dates
4. **File Size Limits**: Maximum 50MB per file
5. **Rating Validation**: Ratings between 1-5 stars only
6. **QR Token Uniqueness**: Ensures unique project access tokens

### Referential Integrity
- **CASCADE DELETE**: Project deletion removes associated files and feedback
- **RESTRICT DELETE**: Employee deletion prevented if they created projects
- **SET NULL**: File deletion removes feedback associations safely

## Security Considerations

### Data Protection
- **Password Storage**: Bcrypt hashed passwords (never plain text)
- **Email Verification**: Support for verified email addresses
- **Token Security**: Cryptographically secure QR tokens
- **Audit Trail**: Comprehensive timestamp tracking

### Access Control
- **Role-Based Permissions**: Four-tier role hierarchy
- **Project Assignments**: Explicit project-employee relationships
- **File Visibility**: Public/private file access control
- **Client Isolation**: Clients only access their project data

## Migration Strategy

### Phase 1: Core Tables
```sql
-- 1. Create employees table
-- 2. Create projects table
-- 3. Create project_employees table
-- 4. Insert initial admin user
```

### Phase 2: File Management
```sql
-- 1. Create project_files table
-- 2. Create file storage directories
-- 3. Set up file access permissions
```

### Phase 3: Client Features
```sql
-- 1. Create client_feedback table
-- 2. Create password_resets table
-- 3. Generate initial QR codes
```

### Rollback Procedures
Each migration includes corresponding rollback scripts with:
- Foreign key constraint removal
- Table drops in reverse dependency order
- Data export for recovery scenarios

## Backup and Maintenance

### Backup Strategy
- **Full Backup**: Daily at 2 AM UTC
- **Incremental Backup**: Every 4 hours
- **Transaction Log Backup**: Every 15 minutes
- **Retention**: 30 days full, 7 days incremental

### Maintenance Tasks
- **Index Optimization**: Weekly on Sundays
- **Statistics Update**: Daily after backup
- **Cleanup Tasks**: Monthly removal of expired tokens
- **Performance Monitoring**: Continuous query analysis

## Future Considerations

### Scalability Enhancements
1. **Read Replicas**: For reporting and analytics
2. **Table Partitioning**: For large file and feedback tables
3. **Archive Strategy**: Historical data retention
4. **Caching Layer**: Redis integration for frequent queries

### Feature Extensions
1. **Audit Logging**: Comprehensive change tracking
2. **File Versioning**: Document revision history
3. **Advanced Search**: Full-text search capabilities
4. **Analytics Tables**: Reporting and dashboard data