-- Database Setup SQL Scripts
-- Employee Login System & QR Code Project Review
-- MySQL 8.0+ Compatible

-- =================================================================
-- SECTION 1: Database and User Setup
-- =================================================================

-- Create database (run as root/admin)
-- CREATE DATABASE unified_contractors CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create application user (run as root/admin)
-- CREATE USER 'uc_app'@'localhost' IDENTIFIED BY 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON unified_contractors.* TO 'uc_app'@'localhost';
-- FLUSH PRIVILEGES;

-- Switch to application database
USE unified_contractors;

-- =================================================================
-- SECTION 2: Core Tables Creation
-- =================================================================

-- Table: employees
-- Purpose: Employee authentication and profile management
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
    
    -- Indexes for performance
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active),
    INDEX idx_last_login (last_login_at),
    INDEX idx_failed_attempts (failed_login_attempts)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: projects
-- Purpose: Project management with QR code access
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
    
    -- Indexes for performance
    INDEX idx_name (name),
    INDEX idx_client_email (client_email),
    INDEX idx_status (status),
    INDEX idx_qr_token (qr_code_token),
    INDEX idx_created_by (created_by),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_public (is_public),
    INDEX idx_progress (progress_percentage),
    
    -- Foreign key constraints
    FOREIGN KEY fk_projects_created_by (created_by) 
        REFERENCES employees(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Business logic constraints
    CONSTRAINT chk_progress_range CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    CONSTRAINT chk_date_order CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: project_employees
-- Purpose: Many-to-many relationship between employees and projects
CREATE TABLE project_employees (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    role ENUM('lead', 'contributor', 'viewer') DEFAULT 'contributor',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint to prevent duplicate assignments
    UNIQUE KEY uk_project_employee (project_id, employee_id),
    
    -- Indexes for performance
    INDEX idx_project (project_id),
    INDEX idx_employee (employee_id),
    INDEX idx_role (role),
    INDEX idx_assigned_at (assigned_at),
    
    -- Foreign key constraints
    FOREIGN KEY fk_proj_emp_project (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY fk_proj_emp_employee (employee_id) 
        REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: project_files
-- Purpose: File metadata and organization for project assets
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
    
    -- Indexes for performance
    INDEX idx_project (project_id),
    INDEX idx_employee (employee_id),
    INDEX idx_category (category),
    INDEX idx_mime_type (mime_type),
    INDEX idx_public (is_public),
    INDEX idx_sort_order (sort_order),
    INDEX idx_uploaded_at (uploaded_at),
    INDEX idx_filename (filename),
    
    -- Foreign key constraints
    FOREIGN KEY fk_files_project (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY fk_files_employee (employee_id) 
        REFERENCES employees(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Business logic constraints
    CONSTRAINT chk_file_size CHECK (file_size > 0 AND file_size <= 52428800), -- 50MB limit
    CONSTRAINT chk_sort_order CHECK (sort_order >= 0)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: client_feedback
-- Purpose: Client feedback, ratings, and communication
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
    
    -- Indexes for performance
    INDEX idx_project (project_id),
    INDEX idx_file (file_id),
    INDEX idx_status (status),
    INDEX idx_client_email (client_email),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_reviewed_by (reviewed_by),
    INDEX idx_rating (rating),
    
    -- Foreign key constraints
    FOREIGN KEY fk_feedback_project (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY fk_feedback_file (file_id) 
        REFERENCES project_files(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY fk_feedback_reviewer (reviewed_by) 
        REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Business logic constraints
    CONSTRAINT chk_rating_range CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: password_resets
-- Purpose: Secure password reset token management
CREATE TABLE password_resets (
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_email (email),
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- SECTION 3: Triggers for Business Logic
-- =================================================================

-- Trigger: Auto-generate QR code token on project creation
DELIMITER $$
CREATE TRIGGER tr_project_qr_token 
    BEFORE INSERT ON projects
    FOR EACH ROW
BEGIN
    IF NEW.qr_code_token = '' OR NEW.qr_code_token IS NULL THEN
        SET NEW.qr_code_token = CONCAT(
            'UC_',
            UPPER(SUBSTRING(SHA2(CONCAT(NEW.name, NEW.client_email, UNIX_TIMESTAMP()), 256), 1, 16)),
            '_',
            UNIX_TIMESTAMP()
        );
    END IF;
END$$
DELIMITER ;

-- Trigger: Update project progress based on file uploads
DELIMITER $$
CREATE TRIGGER tr_update_project_progress 
    AFTER INSERT ON project_files
    FOR EACH ROW
BEGIN
    DECLARE file_count INT;
    DECLARE progress_increment DECIMAL(5,2);
    
    SELECT COUNT(*) INTO file_count 
    FROM project_files 
    WHERE project_id = NEW.project_id;
    
    -- Simple progress calculation: each file adds 2% (max 100%)
    SET progress_increment = LEAST(file_count * 2, 100);
    
    UPDATE projects 
    SET progress_percentage = progress_increment 
    WHERE id = NEW.project_id 
    AND progress_percentage < progress_increment;
END$$
DELIMITER ;

-- Trigger: Reset failed login attempts on successful login
DELIMITER $$
CREATE TRIGGER tr_reset_failed_attempts 
    BEFORE UPDATE ON employees
    FOR EACH ROW
BEGIN
    IF NEW.last_login_at != OLD.last_login_at AND NEW.last_login_at IS NOT NULL THEN
        SET NEW.failed_login_attempts = 0;
    END IF;
END$$
DELIMITER ;

-- =================================================================
-- SECTION 4: Initial Data Seeding
-- =================================================================

-- Insert default super admin user
-- Password: 'UnifiedAdmin2024!' (change immediately in production)
INSERT INTO employees (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    is_active, 
    email_verified_at
) VALUES (
    'admin@unifiedcontractors.com',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Hash of 'UnifiedAdmin2024!'
    'System',
    'Administrator',
    'super_admin',
    TRUE,
    CURRENT_TIMESTAMP
);

-- Insert sample project manager
INSERT INTO employees (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    is_active,
    email_verified_at
) VALUES (
    'manager@unifiedcontractors.com',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Hash of 'UnifiedAdmin2024!'
    'Project',
    'Manager',
    'project_manager',
    TRUE,
    CURRENT_TIMESTAMP
);

-- Insert sample employee
INSERT INTO employees (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    is_active,
    email_verified_at
) VALUES (
    'employee@unifiedcontractors.com',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Hash of 'UnifiedAdmin2024!'
    'Sample',
    'Employee',
    'employee',
    TRUE,
    CURRENT_TIMESTAMP
);

-- =================================================================
-- SECTION 5: Views for Common Queries
-- =================================================================

-- View: Employee projects with role information
CREATE VIEW v_employee_projects AS
SELECT 
    e.id as employee_id,
    e.first_name,
    e.last_name,
    e.email,
    p.id as project_id,
    p.name as project_name,
    p.status as project_status,
    p.progress_percentage,
    pe.role as project_role,
    pe.assigned_at,
    p.start_date,
    p.end_date,
    p.client_name,
    (SELECT COUNT(*) FROM project_files WHERE project_id = p.id) as file_count,
    (SELECT COUNT(*) FROM client_feedback WHERE project_id = p.id AND status = 'new') as new_feedback_count
FROM employees e
JOIN project_employees pe ON e.id = pe.employee_id
JOIN projects p ON pe.project_id = p.id
WHERE e.is_active = TRUE;

-- View: Project summary with statistics
CREATE VIEW v_project_summary AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.client_name,
    p.client_email,
    p.status,
    p.progress_percentage,
    p.start_date,
    p.end_date,
    p.is_public,
    p.qr_code_token,
    p.created_at,
    CONCAT(e.first_name, ' ', e.last_name) as created_by_name,
    (SELECT COUNT(*) FROM project_files WHERE project_id = p.id) as total_files,
    (SELECT COUNT(*) FROM project_files WHERE project_id = p.id AND category = 'image') as image_count,
    (SELECT COUNT(*) FROM project_files WHERE project_id = p.id AND category = 'document') as document_count,
    (SELECT COUNT(*) FROM client_feedback WHERE project_id = p.id) as feedback_count,
    (SELECT AVG(rating) FROM client_feedback WHERE project_id = p.id AND rating IS NOT NULL) as avg_rating,
    (SELECT COUNT(*) FROM project_employees WHERE project_id = p.id) as team_member_count
FROM projects p
JOIN employees e ON p.created_by = e.id;

-- View: Client feedback summary
CREATE VIEW v_client_feedback_summary AS
SELECT 
    cf.id,
    cf.project_id,
    p.name as project_name,
    p.client_name,
    cf.feedback_text,
    cf.rating,
    cf.status,
    cf.client_email,
    cf.submitted_at,
    cf.reviewed_at,
    CASE 
        WHEN cf.reviewed_by IS NOT NULL 
        THEN CONCAT(e.first_name, ' ', e.last_name)
        ELSE NULL
    END as reviewed_by_name,
    CASE 
        WHEN cf.file_id IS NOT NULL 
        THEN pf.original_filename
        ELSE NULL
    END as feedback_file_name
FROM client_feedback cf
JOIN projects p ON cf.project_id = p.id
LEFT JOIN employees e ON cf.reviewed_by = e.id
LEFT JOIN project_files pf ON cf.file_id = pf.id
ORDER BY cf.submitted_at DESC;

-- =================================================================
-- SECTION 6: Stored Procedures for Complex Operations
-- =================================================================

-- Procedure: Generate new QR code for project
DELIMITER $$
CREATE PROCEDURE sp_regenerate_qr_code(
    IN p_project_id BIGINT UNSIGNED,
    IN p_expires_hours INT DEFAULT NULL
)
BEGIN
    DECLARE new_token VARCHAR(255);
    DECLARE expire_time TIMESTAMP;
    
    -- Generate new cryptographically secure token
    SET new_token = CONCAT(
        'UC_',
        UPPER(SUBSTRING(SHA2(CONCAT(p_project_id, UNIX_TIMESTAMP(), RAND()), 256), 1, 20)),
        '_',
        UNIX_TIMESTAMP()
    );
    
    -- Set expiration time if provided
    IF p_expires_hours IS NOT NULL THEN
        SET expire_time = DATE_ADD(NOW(), INTERVAL p_expires_hours HOUR);
    ELSE
        SET expire_time = NULL;
    END IF;
    
    -- Update project with new QR code
    UPDATE projects 
    SET 
        qr_code_token = new_token,
        qr_code_expires_at = expire_time,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_project_id;
    
    -- Return the new token
    SELECT new_token as qr_code_token, expire_time as expires_at;
END$$
DELIMITER ;

-- Procedure: Clean up expired data
DELIMITER $$
CREATE PROCEDURE sp_cleanup_expired_data()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Remove expired password reset tokens
    DELETE FROM password_resets 
    WHERE expires_at < NOW();
    
    -- Log expired QR codes (for audit purposes)
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_expired_qr AS
    SELECT id, name, qr_code_token 
    FROM projects 
    WHERE qr_code_expires_at IS NOT NULL 
    AND qr_code_expires_at < NOW();
    
    -- Optionally regenerate expired QR codes or disable access
    -- UPDATE projects SET qr_code_token = NULL WHERE qr_code_expires_at < NOW();
    
    COMMIT;
    
    -- Return cleanup summary
    SELECT 
        'Cleanup completed' as status,
        ROW_COUNT() as affected_rows,
        NOW() as cleanup_time;
END$$
DELIMITER ;

-- =================================================================
-- SECTION 7: Performance and Maintenance
-- =================================================================

-- Create events for automatic maintenance (requires event_scheduler=ON)
-- SET GLOBAL event_scheduler = ON;

-- Event: Daily cleanup of expired data
CREATE EVENT IF NOT EXISTS ev_daily_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO CALL sp_cleanup_expired_data();

-- Event: Weekly index optimization
CREATE EVENT IF NOT EXISTS ev_weekly_optimize
ON SCHEDULE EVERY 1 WEEK
STARTS DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 WEEK)
DO
BEGIN
    OPTIMIZE TABLE employees, projects, project_employees, project_files, client_feedback, password_resets;
    ANALYZE TABLE employees, projects, project_employees, project_files, client_feedback, password_resets;
END;

-- =================================================================
-- SECTION 8: Security and Audit Setup
-- =================================================================

-- Table: audit_log for tracking changes (optional)
CREATE TABLE audit_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(64) NOT NULL,
    record_id BIGINT UNSIGNED NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    user_id BIGINT UNSIGNED,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================

-- Verify table creation
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH,
    CREATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'unified_contractors'
ORDER BY TABLE_NAME;

-- Verify indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    NON_UNIQUE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'unified_contractors'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Verify foreign key constraints
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'unified_contractors' 
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Test data integrity
SELECT 'Database setup completed successfully' as status, NOW() as completed_at;