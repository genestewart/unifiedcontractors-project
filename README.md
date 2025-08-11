# Unified Contractors Website

[![CI Pipeline](https://github.com/genestewart/unifiedcontractors/actions/workflows/ci.yml/badge.svg)](https://github.com/genestewart/unifiedcontractors/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/genestewart/unifiedcontractors/actions/workflows/deploy.yml/badge.svg)](https://github.com/genestewart/unifiedcontractors/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/genestewart/unifiedcontractors/branch/main/graph/badge.svg)](https://codecov.io/gh/genestewart/unifiedcontractors)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)

Professional website for Unified Contractors - Park City's premier construction and restoration company.

## Features

### Public Website
- **Modern Vue.js 3 Application** - Built with Vite 6 for optimal performance
- **Responsive Design** - Mobile-first approach with Bootstrap grid utilities
- **PrimeVue Components** - Professional UI components with Lara theme
- **SEO Optimized** - Meta tags, structured data, sitemap, and Open Graph support
- **PWA Support** - Offline capability with service workers and app manifest
- **Accessibility** - WCAG 2.1 AA compliant with full keyboard navigation
- **Performance Optimized** - Code splitting, lazy loading, and resource hints
- **Service Showcase** - Comprehensive display of all construction services
- **Contact Integration** - Accessible forms with validation and error handling

### Employee Management System
- **Secure Authentication** - JWT-based login with role-based access control
- **Project Management** - Complete CRUD operations for construction projects
- **File Upload System** - Support for files up to 50MB with drag-and-drop interface
- **QR Code Generation** - Create unique QR codes for client project access
- **Employee Dashboard** - Role-based dashboards for employees, project managers, and admins
- **Client Feedback Management** - View and respond to client ratings and comments

### Client Review System
- **QR Code Access** - Mobile-optimized interface for scanning project QR codes
- **Photo Galleries** - Touch-friendly image viewing with zoom and swipe gestures
- **Document Access** - Download and view project documents and blueprints
- **Feedback Submission** - 5-star rating system with comments and photo uploads
- **Mobile-First Design** - Optimized for smartphone usage without login requirements

### Development & Quality
- **Testing Suite** - Comprehensive unit, integration, and E2E tests
- **CI/CD Pipeline** - Automated testing, building, and deployment
- **Performance Monitoring** - Core Web Vitals tracking and optimization

## Tech Stack

### Frontend
- **Framework:** Vue.js 3 (Composition API)
- **Build Tool:** Vite 6.x with optimized chunking
- **UI Library:** PrimeVue with Lara theme
- **CSS Framework:** Bootstrap (Grid & Utilities)
- **Icons:** PrimeIcons & Lucide Vue
- **Routing:** Vue Router 4 with lazy loading
- **State Management:** Pinia
- **Authentication:** JWT tokens with automatic refresh
- **PWA:** Vite PWA plugin with Workbox

### Backend
- **Framework:** Laravel PHP with Sanctum authentication
- **Database:** MySQL with Eloquent ORM
- **File Storage:** Local storage with security validation
- **API Design:** RESTful APIs with proper error handling
- **Security:** CSRF protection, XSS prevention, input validation

### Development & Testing
- **Testing:** Vitest + Vue Test Utils + Playwright (E2E)
- **Linting:** ESLint 9 with flat config
- **Performance:** Core Web Vitals monitoring
- **CI/CD:** GitHub Actions with automated testing

## Color Palette

Extracted from the company logo:
- Primary Blue: `#05b3f2`
- Secondary Red: `#e30414`
- Dark: `#252525`
- Light: `#fbfbfb`
- Gray: `#9ea8ac`

## Project Structure

```
src/
├── components/
│   ├── home/         # Homepage sections
│   ├── layout/       # Header, Footer, and layout components
│   ├── auth/         # Authentication components
│   ├── employee/     # Employee dashboard components
│   └── client/       # Client review components
├── composables/      # Reusable composition functions
│   ├── useSEO.js    # SEO management
│   ├── useAccessibility.js # A11y utilities
│   ├── useLazyImage.js # Image optimization
│   ├── useMobileOptimization.js # Mobile performance
│   ├── useCaching.js # Browser caching
│   └── usePerformance.js # Performance monitoring
├── views/           # Page components
│   ├── employee/    # Employee management pages
│   └── client/      # Client review pages
├── stores/          # Pinia state management
│   ├── auth.js      # Authentication state
│   ├── projects.js  # Project management
│   ├── files.js     # File upload management
│   ├── feedback.js  # Client feedback
│   └── client.js    # Client-specific state
├── services/        # API and external services
│   └── api/         # API integration layer
├── router/          # Vue Router configuration
├── styles/          # Global styles
├── assets/          # Static assets including logo
├── test/            # Test suites and utilities
└── utils/           # Helper functions and utilities

backend/             # Laravel backend
├── app/
│   ├── Models/      # Eloquent models
│   └── Http/        # Controllers and middleware
├── database/
│   ├── migrations/  # Database schema
│   └── seeders/     # Sample data
├── config/          # Laravel configuration
└── tests/           # Backend test suites
```

## Installation

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Setup (Laravel)
```bash
# Navigate to backend directory
cd backend

# Install PHP dependencies
composer install

# Copy environment file and configure database
cp .env.example .env

# Generate application key
php artisan key:generate

# Run database migrations
php artisan migrate

# Seed database with sample data
php artisan db:seed

# Start Laravel development server
php artisan serve
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server at http://localhost:5173
npm run preview          # Preview production build

# Building
npm run build            # Build for production
npm run build:analyze    # Build with bundle analysis

# Frontend Testing
npm test                 # Run tests in interactive mode
npm run test:run         # Run tests once
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:unit        # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e         # Run end-to-end tests
npm run test:security    # Run security tests
npm run test:performance # Run performance tests

# Backend Testing
cd backend
composer test            # Run PHP unit tests
php artisan test         # Run Laravel tests

# Code Quality
npm run lint             # Run ESLint with auto-fix

# Performance
npm run perf:audit       # Run Lighthouse audit
npm run perf:test        # Run performance tests
```

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

### Continuous Integration
- **Multi-version Node.js testing** (18.x, 20.x, 22.x)
- **Automated linting** with ESLint v9
- **Unit testing** with Vitest and coverage reporting
- **Security scanning** for vulnerabilities
- **Build verification** for production readiness
- **Lighthouse performance audits** on PRs

### Continuous Deployment
- **Automatic deployment** to GitHub Pages on main branch
- **Alternative deployment** options for Netlify and Vercel
- **Environment-specific** builds and configurations

### Running Workflows Locally

You can test GitHub Actions workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or see: https://github.com/nektos/act#installation

# Run CI workflow
act -W .github/workflows/ci.yml

# Run specific job
act -j lint-and-test -W .github/workflows/ci.yml
```

## Development

The website follows a modular component architecture with:
- Reusable components for consistent UI
- Responsive design patterns
- Accessibility best practices (WCAG 2.1 AA)
- Performance optimization (Core Web Vitals focused)
- Comprehensive testing coverage
- SEO-friendly architecture

### Performance Metrics

- **Bundle Size:** 28KB gzipped (main bundle)
- **Lighthouse Score:** 90+ target
- **Core Web Vitals:**
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1

### Testing

The project includes comprehensive testing:
- **Frontend**: Unit, integration, and E2E tests for all components
- **Backend**: PHPUnit tests for models, controllers, and API endpoints  
- **Security**: Authentication, authorization, and input validation tests
- **Performance**: File upload, mobile optimization, and Core Web Vitals monitoring
- **Accessibility**: WCAG 2.1 AA compliance testing
- **Integration**: End-to-end user journey testing with Playwright

## Services Highlighted

1. **Custom Home Construction** - Luxury mountain homes with LEED certification
2. **Design Services** - Professional architectural and interior design
3. **Complete Remodeling** - Kitchen, bath, and whole home renovations
4. **Water Damage Restoration** - 24/7 emergency response
5. **Sump Pump Systems** - Installation and maintenance

## Contact Information

- **Phone:** (435) 555-0100
- **Email:** info@unifiedcontractors.com
- **Address:** 8343 N Silver Creek Rd, Park City, UT 84098

## Documentation

### Project Documentation
- [Project Requirements Document](.claude/PRD.md) - Complete feature specifications
- [Task Management](.claude/TASKS.md) - Detailed development tasks and assignments
- [Progress Tracking](.claude/PROGRESS.md) - Development progress and milestones
- [CLAUDE.md](CLAUDE.md) - Multi-agent development system guide

### Technical Documentation
- [API Documentation](docs/api-specification.md) - Backend API specifications
- [Database Schema](docs/database-schema.md) - Database design and relationships
- [Authentication Design](docs/authentication-design.md) - Authentication system architecture
- [Security Implementation](docs/security-implementation-guide.md) - Security best practices
- [Frontend Architecture](docs/frontend-architecture-integration.md) - Frontend integration guide

### Testing Documentation
- [Testing Guide](TESTING.md) - Comprehensive testing documentation

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Run tests (`npm run test:run`)
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## License

© 2025 Unified Contractors. All rights reserved.