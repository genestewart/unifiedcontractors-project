# API Architecture Specification
## RESTful API Design for Employee Login & QR Code Project Review System

### Overview
This document defines the complete API architecture for the Employee Login System and QR Code Project Review features. The API follows RESTful conventions, implements comprehensive security measures, and provides efficient endpoints for all system operations.

## API Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          API Gateway Layer                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  Rate Limiting  │  │  CORS Handler   │  │  Request Logger │                 │
│  │  Throttle       │  │  Security       │  │  Audit Trail    │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Authentication Layer                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  JWT Validation │  │  Role-Based     │  │  Permission     │                 │
│  │  Token Manager  │  │  Access Control │  │  Checker        │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Business Logic Layer                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  Auth Service   │  │  Project Service│  │  File Service   │                 │
│  │  Controllers    │  │  Controllers    │  │  Controllers    │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│                                    │                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  QR Code        │  │  Client Access  │  │  Feedback       │                 │
│  │  Controllers    │  │  Controllers    │  │  Controllers    │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Data Access Layer                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  Eloquent ORM   │  │  Query Builder  │  │  Cache Layer    │                 │
│  │  Repositories   │  │  Optimizations  │  │  Redis/Memory   │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## API Standards and Conventions

### Base URL Structure
```
Production:  https://api.unifiedcontractors.com/v1/
Staging:     https://staging-api.unifiedcontractors.com/v1/
Development: http://localhost:8000/api/v1/
```

### HTTP Methods and Usage
- **GET**: Retrieve data (idempotent, cacheable)
- **POST**: Create new resources
- **PUT**: Update entire resource (idempotent)
- **PATCH**: Partial resource update
- **DELETE**: Remove resource (idempotent)

### Response Format Standards
```json
// Success Response Format
{
    "success": true,
    "message": "Operation completed successfully",
    "data": {
        // Response data here
    },
    "meta": {
        "timestamp": "2024-01-15T10:30:00Z",
        "version": "1.0",
        "request_id": "req_abc123def456"
    }
}

// Error Response Format
{
    "success": false,
    "message": "Operation failed",
    "errors": {
        "field_name": ["Error message 1", "Error message 2"]
    },
    "error_code": "VALIDATION_FAILED",
    "meta": {
        "timestamp": "2024-01-15T10:30:00Z",
        "version": "1.0",
        "request_id": "req_abc123def456"
    }
}

// Paginated Response Format
{
    "success": true,
    "message": "Data retrieved successfully",
    "data": [
        // Array of items
    ],
    "pagination": {
        "current_page": 1,
        "last_page": 10,
        "per_page": 15,
        "total": 150,
        "from": 1,
        "to": 15
    },
    "links": {
        "first": "/api/v1/projects?page=1",
        "last": "/api/v1/projects?page=10",
        "prev": null,
        "next": "/api/v1/projects?page=2"
    }
}
```

### HTTP Status Codes
- **200 OK**: Successful GET, PUT, PATCH requests
- **201 Created**: Successful POST requests
- **204 No Content**: Successful DELETE requests
- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

## Authentication Endpoints

### POST /api/v1/auth/login
**Purpose**: Authenticate employee and generate access tokens

**Request**:
```json
{
    "email": "employee@unifiedcontractors.com",
    "password": "SecurePassword123!",
    "remember_me": true,
    "device_fingerprint": "base64_encoded_fingerprint"
}
```

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "employee": {
            "id": 123,
            "email": "employee@unifiedcontractors.com",
            "first_name": "John",
            "last_name": "Doe",
            "role": "project_manager",
            "permissions": ["projects.read", "projects.create", "files.upload"],
            "last_login_at": "2024-01-15T10:30:00Z"
        },
        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "expires_in": 900,
        "token_type": "Bearer"
    }
}
```

**Error Response (401 Unauthorized)**:
```json
{
    "success": false,
    "message": "Invalid credentials",
    "errors": {
        "email": ["The provided credentials are invalid."]
    },
    "error_code": "INVALID_CREDENTIALS",
    "remaining_attempts": 3
}
```

### POST /api/v1/auth/refresh
**Purpose**: Refresh expired access token using refresh token

**Request**: Empty body (refresh token in HttpOnly cookie)

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "expires_in": 900,
        "token_type": "Bearer"
    }
}
```

### POST /api/v1/auth/logout
**Purpose**: Invalidate current session and tokens

**Request**:
```json
{
    "logout_all_devices": false
}
```

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

### POST /api/v1/auth/forgot-password
**Purpose**: Request password reset email

**Request**:
```json
{
    "email": "employee@unifiedcontractors.com"
}
```

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Password reset link sent to your email"
}
```

### POST /api/v1/auth/reset-password
**Purpose**: Reset password using email token

**Request**:
```json
{
    "email": "employee@unifiedcontractors.com",
    "token": "reset_token_from_email",
    "password": "NewSecurePassword123!",
    "password_confirmation": "NewSecurePassword123!"
}
```

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Password reset successfully"
}
```

### GET /api/v1/auth/me
**Purpose**: Get current authenticated user information

**Headers**: `Authorization: Bearer {access_token}`

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "User data retrieved successfully",
    "data": {
        "employee": {
            "id": 123,
            "email": "employee@unifiedcontractors.com",
            "first_name": "John",
            "last_name": "Doe",
            "role": "project_manager",
            "permissions": ["projects.read", "projects.create", "files.upload"],
            "last_login_at": "2024-01-15T10:30:00Z",
            "created_at": "2023-01-01T00:00:00Z"
        }
    }
}
```

## Project Management Endpoints

### GET /api/v1/projects
**Purpose**: List projects with filtering, sorting, and pagination

**Query Parameters**:
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 15, max: 100)
- `status`: Filter by status (planning, active, on_hold, completed, archived)
- `search`: Search in name, description, client_name
- `sort`: Sort field (name, start_date, progress_percentage, created_at)
- `order`: Sort order (asc, desc)
- `assigned_to`: Filter by assigned employee ID
- `client_email`: Filter by client email

**Headers**: `Authorization: Bearer {access_token}`

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Projects retrieved successfully",
    "data": [
        {
            "id": 1,
            "name": "Modern Kitchen Remodel",
            "description": "Complete kitchen renovation with modern appliances",
            "client_name": "Sarah Johnson",
            "client_email": "sarah.johnson@email.com",
            "status": "active",
            "progress_percentage": 75.50,
            "start_date": "2024-01-01",
            "end_date": "2024-03-15",
            "is_public": true,
            "qr_code_token": "UC_ABC123DEF456_1705312200",
            "created_by": {
                "id": 123,
                "name": "John Doe",
                "email": "employee@unifiedcontractors.com"
            },
            "team_members": [
                {
                    "id": 123,
                    "name": "John Doe",
                    "role": "lead"
                }
            ],
            "file_counts": {
                "total": 25,
                "images": 20,
                "documents": 3,
                "videos": 2
            },
            "feedback_summary": {
                "total": 5,
                "new": 1,
                "average_rating": 4.8
            },
            "created_at": "2023-12-01T00:00:00Z",
            "updated_at": "2024-01-15T10:30:00Z"
        }
    ],
    "pagination": {
        "current_page": 1,
        "last_page": 3,
        "per_page": 15,
        "total": 42,
        "from": 1,
        "to": 15
    }
}
```

### GET /api/v1/projects/{id}
**Purpose**: Get detailed project information

**Headers**: `Authorization: Bearer {access_token}`

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Project retrieved successfully",
    "data": {
        "id": 1,
        "name": "Modern Kitchen Remodel",
        "description": "Complete kitchen renovation with modern appliances and custom cabinetry",
        "client_name": "Sarah Johnson",
        "client_email": "sarah.johnson@email.com",
        "status": "active",
        "progress_percentage": 75.50,
        "start_date": "2024-01-01",
        "end_date": "2024-03-15",
        "is_public": true,
        "qr_code_token": "UC_ABC123DEF456_1705312200",
        "qr_code_expires_at": null,
        "qr_code_url": "https://unifiedcontractors.com/client/project/UC_ABC123DEF456_1705312200",
        "created_by": {
            "id": 123,
            "name": "John Doe",
            "email": "employee@unifiedcontractors.com"
        },
        "team_members": [
            {
                "id": 123,
                "name": "John Doe",
                "role": "lead",
                "assigned_at": "2023-12-01T00:00:00Z"
            },
            {
                "id": 124,
                "name": "Jane Smith",
                "role": "contributor",
                "assigned_at": "2023-12-05T00:00:00Z"
            }
        ],
        "recent_files": [
            {
                "id": 501,
                "filename": "kitchen-progress-2024-01-15.jpg",
                "category": "image",
                "uploaded_at": "2024-01-15T09:00:00Z",
                "uploaded_by": "John Doe"
            }
        ],
        "recent_feedback": [
            {
                "id": 301,
                "feedback_text": "Love the new countertops!",
                "rating": 5,
                "submitted_at": "2024-01-14T15:30:00Z",
                "status": "new"
            }
        ],
        "statistics": {
            "total_files": 25,
            "file_categories": {
                "images": 20,
                "documents": 3,
                "videos": 2
            },
            "feedback_stats": {
                "total": 5,
                "new": 1,
                "average_rating": 4.8
            },
            "activity_score": 85
        },
        "created_at": "2023-12-01T00:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
    }
}
```

### POST /api/v1/projects
**Purpose**: Create new project

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
    "name": "Bathroom Renovation",
    "description": "Master bathroom complete renovation with luxury finishes",
    "client_name": "Michael Brown",
    "client_email": "michael.brown@email.com",
    "start_date": "2024-02-01",
    "end_date": "2024-04-30",
    "is_public": true,
    "team_members": [
        {
            "employee_id": 123,
            "role": "lead"
        },
        {
            "employee_id": 124,
            "role": "contributor"
        }
    ],
    "qr_code_expires_hours": null
}
```

**Response (201 Created)**:
```json
{
    "success": true,
    "message": "Project created successfully",
    "data": {
        "id": 2,
        "name": "Bathroom Renovation",
        "description": "Master bathroom complete renovation with luxury finishes",
        "client_name": "Michael Brown",
        "client_email": "michael.brown@email.com",
        "status": "planning",
        "progress_percentage": 0.00,
        "start_date": "2024-02-01",
        "end_date": "2024-04-30",
        "is_public": true,
        "qr_code_token": "UC_XYZ789ABC123_1705312800",
        "qr_code_url": "https://unifiedcontractors.com/client/project/UC_XYZ789ABC123_1705312800",
        "created_by": {
            "id": 123,
            "name": "John Doe"
        },
        "team_members": [
            {
                "id": 123,
                "name": "John Doe",
                "role": "lead"
            },
            {
                "id": 124,
                "name": "Jane Smith",
                "role": "contributor"
            }
        ],
        "created_at": "2024-01-15T11:00:00Z"
    }
}
```

### PUT /api/v1/projects/{id}
**Purpose**: Update entire project

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
    "name": "Bathroom Renovation - Updated",
    "description": "Master bathroom complete renovation with luxury finishes and heated floors",
    "client_name": "Michael Brown",
    "client_email": "michael.brown@email.com",
    "status": "active",
    "progress_percentage": 25.00,
    "start_date": "2024-02-01",
    "end_date": "2024-05-15",
    "is_public": true
}
```

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Project updated successfully",
    "data": {
        "id": 2,
        "name": "Bathroom Renovation - Updated",
        "description": "Master bathroom complete renovation with luxury finishes and heated floors",
        "status": "active",
        "progress_percentage": 25.00,
        "updated_at": "2024-01-15T11:30:00Z"
    }
}
```

### PATCH /api/v1/projects/{id}
**Purpose**: Partial project update

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
    "status": "on_hold",
    "progress_percentage": 30.00
}
```

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Project updated successfully",
    "data": {
        "id": 2,
        "status": "on_hold",
        "progress_percentage": 30.00,
        "updated_at": "2024-01-15T12:00:00Z"
    }
}
```

### DELETE /api/v1/projects/{id}
**Purpose**: Archive project (soft delete)

**Headers**: `Authorization: Bearer {access_token}`

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Project archived successfully"
}
```

### POST /api/v1/projects/{id}/restore
**Purpose**: Restore archived project

**Headers**: `Authorization: Bearer {access_token}`

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Project restored successfully",
    "data": {
        "id": 2,
        "status": "planning",
        "restored_at": "2024-01-15T12:30:00Z"
    }
}
```

### POST /api/v1/projects/{id}/qr-regenerate
**Purpose**: Generate new QR code for project

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
    "expires_hours": 168
}
```

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "QR code regenerated successfully",
    "data": {
        "qr_code_token": "UC_NEW123TOKEN456_1705315200",
        "qr_code_url": "https://unifiedcontractors.com/client/project/UC_NEW123TOKEN456_1705315200",
        "qr_code_expires_at": "2024-01-22T12:00:00Z",
        "qr_code_image_url": "https://api.unifiedcontractors.com/v1/qr-codes/UC_NEW123TOKEN456_1705315200.png"
    }
}
```

## File Management Endpoints

### GET /api/v1/projects/{id}/files
**Purpose**: List project files with filtering and sorting

**Query Parameters**:
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)
- `category`: Filter by category (image, document, video, blueprint, other)
- `search`: Search in filename, description
- `sort`: Sort field (filename, uploaded_at, file_size, category)
- `order`: Sort order (asc, desc)
- `public_only`: Show only public files (true/false)

**Headers**: `Authorization: Bearer {access_token}`

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Files retrieved successfully",
    "data": [
        {
            "id": 501,
            "project_id": 1,
            "filename": "kitchen-progress-2024-01-15.jpg",
            "original_filename": "IMG_20240115_090034.jpg",
            "file_size": 2048576,
            "file_size_human": "2.0 MB",
            "mime_type": "image/jpeg",
            "category": "image",
            "description": "Kitchen progress showing completed countertop installation",
            "is_public": true,
            "sort_order": 10,
            "metadata": {
                "dimensions": "3024x4032",
                "camera": "iPhone 14 Pro",
                "location": "Kitchen area",
                "tags": ["progress", "countertops", "installation"]
            },
            "thumbnails": {
                "small": "/api/v1/files/501/thumbnail?size=small",
                "medium": "/api/v1/files/501/thumbnail?size=medium",
                "large": "/api/v1/files/501/thumbnail?size=large"
            },
            "download_url": "/api/v1/files/501/download",
            "uploaded_by": {
                "id": 123,
                "name": "John Doe"
            },
            "uploaded_at": "2024-01-15T09:00:00Z",
            "updated_at": "2024-01-15T09:00:00Z"
        }
    ],
    "pagination": {
        "current_page": 1,
        "last_page": 2,
        "per_page": 20,
        "total": 25,
        "from": 1,
        "to": 20
    },
    "statistics": {
        "total_files": 25,
        "total_size": 157286400,
        "total_size_human": "150 MB",
        "categories": {
            "image": 20,
            "document": 3,
            "video": 2
        }
    }
}
```

### POST /api/v1/projects/{id}/files
**Purpose**: Upload files to project

**Headers**: 
- `Authorization: Bearer {access_token}`
- `Content-Type: multipart/form-data`

**Request** (multipart/form-data):
```
files[]: [File object]
files[]: [File object]
descriptions[]: "Kitchen progress photo"
descriptions[]: "Updated floor plan"
categories[]: "image"
categories[]: "document"
is_public[]: true
is_public[]: false
sort_orders[]: 10
sort_orders[]: 20
```

**Response (201 Created)**:
```json
{
    "success": true,
    "message": "Files uploaded successfully",
    "data": {
        "uploaded": [
            {
                "id": 502,
                "filename": "kitchen-progress-2024-01-15-002.jpg",
                "original_filename": "IMG_20240115_100034.jpg",
                "file_size": 1847562,
                "category": "image",
                "is_public": true,
                "upload_status": "success"
            },
            {
                "id": 503,
                "filename": "updated-floor-plan-v2.pdf",
                "original_filename": "Kitchen Floor Plan v2.pdf",
                "file_size": 524288,
                "category": "document",
                "is_public": false,
                "upload_status": "success"
            }
        ],
        "failed": [],
        "summary": {
            "total_files": 2,
            "successful": 2,
            "failed": 0,
            "total_size": 2371850
        }
    }
}
```

### GET /api/v1/files/{id}
**Purpose**: Get file details and metadata

**Headers**: `Authorization: Bearer {access_token}`

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "File details retrieved successfully",
    "data": {
        "id": 501,
        "project_id": 1,
        "project_name": "Modern Kitchen Remodel",
        "filename": "kitchen-progress-2024-01-15.jpg",
        "original_filename": "IMG_20240115_090034.jpg",
        "file_path": "/storage/projects/1/images/kitchen-progress-2024-01-15.jpg",
        "file_size": 2048576,
        "file_size_human": "2.0 MB",
        "mime_type": "image/jpeg",
        "category": "image",
        "description": "Kitchen progress showing completed countertop installation",
        "is_public": true,
        "sort_order": 10,
        "metadata": {
            "dimensions": "3024x4032",
            "camera": "iPhone 14 Pro",
            "location": "Kitchen area",
            "exif": {
                "date_time": "2024-01-15T09:00:34Z",
                "exposure": "1/60s",
                "aperture": "f/1.78",
                "iso": 100
            },
            "tags": ["progress", "countertops", "installation"],
            "processed": true,
            "virus_scan": "clean"
        },
        "thumbnails": {
            "small": "/api/v1/files/501/thumbnail?size=small",
            "medium": "/api/v1/files/501/thumbnail?size=medium",
            "large": "/api/v1/files/501/thumbnail?size=large"
        },
        "download_url": "/api/v1/files/501/download",
        "uploaded_by": {
            "id": 123,
            "name": "John Doe",
            "email": "employee@unifiedcontractors.com"
        },
        "download_stats": {
            "total_downloads": 15,
            "last_downloaded_at": "2024-01-15T14:30:00Z"
        },
        "uploaded_at": "2024-01-15T09:00:00Z",
        "updated_at": "2024-01-15T09:05:00Z"
    }
}
```

### PUT /api/v1/files/{id}
**Purpose**: Update file metadata

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
    "description": "Updated kitchen progress showing completed countertop and backsplash installation",
    "category": "image",
    "is_public": true,
    "sort_order": 15,
    "metadata": {
        "tags": ["progress", "countertops", "backsplash", "completion"],
        "location": "Kitchen area - countertop section",
        "notes": "Final inspection approved"
    }
}
```

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "File metadata updated successfully",
    "data": {
        "id": 501,
        "description": "Updated kitchen progress showing completed countertop and backsplash installation",
        "metadata": {
            "tags": ["progress", "countertops", "backsplash", "completion"],
            "location": "Kitchen area - countertop section",
            "notes": "Final inspection approved"
        },
        "updated_at": "2024-01-15T15:00:00Z"
    }
}
```

### GET /api/v1/files/{id}/download
**Purpose**: Download file with access logging

**Headers**: `Authorization: Bearer {access_token}`

**Response**: File stream with appropriate headers
```
Content-Type: image/jpeg
Content-Disposition: attachment; filename="IMG_20240115_090034.jpg"
Content-Length: 2048576
Cache-Control: private, max-age=3600
```

### DELETE /api/v1/files/{id}
**Purpose**: Delete file

**Headers**: `Authorization: Bearer {access_token}`

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "File deleted successfully"
}
```

### POST /api/v1/files/bulk-delete
**Purpose**: Delete multiple files

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
    "file_ids": [501, 502, 503]
}
```

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Files deleted successfully",
    "data": {
        "deleted": [501, 502, 503],
        "failed": [],
        "summary": {
            "total_requested": 3,
            "successful": 3,
            "failed": 0
        }
    }
}
```

## Client Access Endpoints (No Authentication Required)

### GET /api/v1/client/project/{token}
**Purpose**: Get project information via QR code token

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Project retrieved successfully",
    "data": {
        "project": {
            "id": 1,
            "name": "Modern Kitchen Remodel",
            "description": "Complete kitchen renovation with modern appliances",
            "client_name": "Sarah Johnson",
            "status": "active",
            "progress_percentage": 75.50,
            "start_date": "2024-01-01",
            "end_date": "2024-03-15",
            "team_contact": {
                "name": "John Doe",
                "email": "john.doe@unifiedcontractors.com",
                "phone": "(555) 123-4567"
            },
            "company_info": {
                "name": "Unified Contractors",
                "website": "https://unifiedcontractors.com",
                "phone": "(555) 987-6543",
                "address": "123 Main St, Park City, UT 84060"
            }
        },
        "statistics": {
            "total_files": 20,
            "recent_updates": 5,
            "completion_percentage": 75.50
        }
    }
}
```

### GET /api/v1/client/project/{token}/files
**Purpose**: Get project files accessible to client

**Query Parameters**:
- `category`: Filter by category
- `page`: Page number
- `per_page`: Items per page

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Project files retrieved successfully",
    "data": [
        {
            "id": 501,
            "filename": "kitchen-progress-2024-01-15.jpg",
            "file_size": 2048576,
            "file_size_human": "2.0 MB",
            "category": "image",
            "description": "Kitchen progress showing completed countertop installation",
            "thumbnails": {
                "small": "/api/v1/client/files/501/thumbnail?token={token}&size=small",
                "medium": "/api/v1/client/files/501/thumbnail?token={token}&size=medium",
                "large": "/api/v1/client/files/501/thumbnail?token={token}&size=large"
            },
            "download_url": "/api/v1/client/files/501/download/{token}",
            "uploaded_at": "2024-01-15T09:00:00Z"
        }
    ],
    "pagination": {
        "current_page": 1,
        "last_page": 2,
        "per_page": 20,
        "total": 20
    }
}
```

### GET /api/v1/client/files/{id}/download/{token}
**Purpose**: Download file via client access token

**Response**: File stream with appropriate headers

### POST /api/v1/client/feedback
**Purpose**: Submit client feedback

**Request**:
```json
{
    "project_token": "UC_ABC123DEF456_1705312200",
    "file_id": 501,
    "feedback_text": "The kitchen looks amazing! We love the new countertops.",
    "rating": 5,
    "client_email": "sarah.johnson@email.com"
}
```

**Response (201 Created)**:
```json
{
    "success": true,
    "message": "Feedback submitted successfully",
    "data": {
        "id": 401,
        "feedback_text": "The kitchen looks amazing! We love the new countertops.",
        "rating": 5,
        "status": "new",
        "submitted_at": "2024-01-15T16:00:00Z",
        "confirmation_number": "FB-2024-001-401"
    }
}
```

## Dashboard and Analytics Endpoints

### GET /api/v1/dashboard/stats
**Purpose**: Get dashboard statistics for authenticated employee

**Headers**: `Authorization: Bearer {access_token}`

**Response (200 OK)**:
```json
{
    "success": true,
    "message": "Dashboard statistics retrieved successfully",
    "data": {
        "projects": {
            "total": 15,
            "active": 8,
            "completed": 5,
            "on_hold": 2
        },
        "files": {
            "total_uploaded": 245,
            "uploaded_this_month": 32,
            "total_size": "1.2 GB"
        },
        "feedback": {
            "total": 67,
            "new": 5,
            "average_rating": 4.7,
            "pending_review": 3
        },
        "qr_scans": {
            "total": 156,
            "this_week": 23,
            "unique_clients": 12
        },
        "recent_activity": [
            {
                "type": "file_upload",
                "message": "New progress photo uploaded to Kitchen Remodel",
                "timestamp": "2024-01-15T14:30:00Z"
            },
            {
                "type": "feedback_received", 
                "message": "New 5-star feedback received from Sarah Johnson",
                "timestamp": "2024-01-15T13:45:00Z"
            }
        ],
        "performance": {
            "projects_on_time": 85,
            "client_satisfaction": 4.7,
            "response_time_hours": 2.3
        }
    }
}
```

## Error Handling and Status Codes

### Common Error Responses

#### 400 Bad Request
```json
{
    "success": false,
    "message": "Invalid request format",
    "errors": {
        "field_name": ["Field is required", "Field must be a string"]
    },
    "error_code": "VALIDATION_ERROR"
}
```

#### 401 Unauthorized
```json
{
    "success": false,
    "message": "Authentication required",
    "error_code": "AUTHENTICATION_REQUIRED"
}
```

#### 403 Forbidden
```json
{
    "success": false,
    "message": "Insufficient permissions to access this resource",
    "error_code": "INSUFFICIENT_PERMISSIONS",
    "required_permission": "projects.create"
}
```

#### 404 Not Found
```json
{
    "success": false,
    "message": "Resource not found",
    "error_code": "RESOURCE_NOT_FOUND"
}
```

#### 422 Unprocessable Entity
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "email": ["The email field is required."],
        "password": ["The password must be at least 8 characters."]
    },
    "error_code": "VALIDATION_FAILED"
}
```

#### 429 Too Many Requests
```json
{
    "success": false,
    "message": "Rate limit exceeded",
    "error_code": "RATE_LIMIT_EXCEEDED",
    "retry_after": 60
}
```

#### 500 Internal Server Error
```json
{
    "success": false,
    "message": "An unexpected error occurred",
    "error_code": "INTERNAL_SERVER_ERROR",
    "reference_id": "err_abc123def456"
}
```

## Rate Limiting Configuration

### Rate Limits by Endpoint Group
```php
// Rate limiting configuration
'rate_limits' => [
    'auth.login' => '5:1',           // 5 attempts per minute
    'auth.refresh' => '10:1',        // 10 refreshes per minute  
    'auth.forgot-password' => '3:5',  // 3 attempts per 5 minutes
    'auth.reset-password' => '2:10',  // 2 resets per 10 minutes
    'file.upload' => '30:5',         // 30 uploads per 5 minutes
    'file.download' => '100:5',      // 100 downloads per 5 minutes
    'client.access' => '200:5',      // 200 requests per 5 minutes
    'client.feedback' => '5:10',     // 5 feedback submissions per 10 minutes
    'api.general' => '120:1',        // 120 requests per minute (general)
    'api.heavy' => '20:1',           // 20 requests per minute (heavy operations)
]
```

## Performance Optimization

### Caching Strategy
- **Response Caching**: Static data cached for 5 minutes
- **Query Caching**: Database queries cached for 2 minutes
- **File Thumbnails**: Cached for 24 hours
- **Project Statistics**: Cached for 10 minutes

### Pagination Defaults
- **Default Page Size**: 15 items
- **Maximum Page Size**: 100 items
- **Large Dataset Streaming**: For exports > 1000 items

### Database Query Optimization
- **Eager Loading**: Prevent N+1 queries
- **Index Usage**: Optimized indexes for all query patterns
- **Query Monitoring**: Slow query detection and alerting

## API Security Measures

### Input Validation
- All inputs sanitized and validated
- SQL injection prevention via prepared statements
- XSS prevention via output encoding
- File upload validation (type, size, malware scanning)

### Authentication Security
- JWT tokens with short expiration (15 minutes)
- Refresh token rotation
- Device fingerprinting for additional security
- Failed login attempt tracking and account lockout

### Data Protection
- HTTPS enforcement for all endpoints
- Sensitive data encryption at rest
- PII data minimization
- Secure file storage outside web root

This comprehensive API specification provides the foundation for implementing a secure, scalable, and well-documented REST API for the Employee Login System and QR Code Project Review features.