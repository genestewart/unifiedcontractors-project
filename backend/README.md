# Unified Contractors Backend API

## Overview

Laravel-based backend API for the Unified Contractors project management system, providing secure authentication, project management, file handling, and client review functionality through QR codes.

## Features

- **JWT Authentication** - Secure employee authentication with Laravel Sanctum
- **Role-Based Access Control** - Employee, Project Manager, Admin, and Super Admin roles
- **Project Management** - Complete CRUD operations for construction projects
- **File Upload System** - Support for files up to 50MB with security validation
- **QR Code Generation** - Unique QR codes for client project access
- **Client Feedback API** - Public endpoints for client reviews and ratings

## Requirements

- PHP 8.1 or higher
- Composer 2.x
- MySQL 8.0 or higher
- Laravel 11.x

## Installation

```bash
# Install PHP dependencies
composer install

# Copy environment configuration
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env file
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=unifiedcontractors
# DB_USERNAME=your_username
# DB_PASSWORD=your_password

# Run database migrations
php artisan migrate

# Seed database with initial data
php artisan db:seed

# Start development server
php artisan serve
```

## Database Structure

### Core Tables
- `employees` - User authentication and employee management
- `projects` - Construction project information
- `project_employees` - Team assignments and roles
- `project_files` - File uploads and metadata
- `client_feedback` - Client ratings and comments

## API Endpoints

### Authentication
- `POST /api/auth/login` - Employee login
- `POST /api/auth/logout` - Employee logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user info

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Files
- `POST /api/projects/{id}/files` - Upload files
- `GET /api/projects/{id}/files` - List project files
- `DELETE /api/files/{id}` - Delete file

### Client Access (No Auth Required)
- `GET /api/client/validate-token/{token}` - Validate QR code token
- `GET /api/client/file/{token}/{fileId}` - Download file
- `POST /api/client/submit-feedback` - Submit client feedback

## Security Features

- JWT token authentication with 15-minute expiration
- Automatic token refresh mechanism
- Password hashing with bcrypt
- File type and size validation
- SQL injection prevention
- XSS protection
- CSRF protection for web routes

## Testing

```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test --testsuite=Unit
php artisan test --testsuite=Feature

# Run with coverage
php artisan test --coverage
```

## Development Commands

```bash
# Clear application cache
php artisan cache:clear

# Clear configuration cache
php artisan config:clear

# Optimize for production
php artisan optimize

# Generate IDE helper files
php artisan ide-helper:generate
```

## Environment Configuration

Key environment variables:

```env
# Application
APP_NAME="Unified Contractors"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=unifiedcontractors
DB_USERNAME=root
DB_PASSWORD=

# JWT/Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DOMAIN=localhost

# File Upload
MAX_FILE_SIZE=52428800  # 50MB in bytes
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Project Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   └── Middleware/
│   └── Models/
│       ├── Employee.php
│       ├── Project.php
│       ├── ProjectFile.php
│       └── ClientFeedback.php
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   ├── api.php
│   └── web.php
├── config/
│   ├── sanctum.php
│   └── cors.php
└── tests/
    ├── Unit/
    └── Feature/
```

## License

© 2025 Unified Contractors. All rights reserved.