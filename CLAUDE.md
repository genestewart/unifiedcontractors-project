# CLAUDE.md - Multi-Agent Development System Guide

## Agent Team Structure

This development system consists of 7 specialized agents working together to deliver high-quality software projects:

### Primary Communication Agent
- **project-coordinator-researcher** - *Default communication agent* - Manages overall project workflow, coordinates team activities, and conducts research to inform decisions

### Specialized Development Agents
- **system-architect** - Designs system architecture, database schemas, and technical specifications
- **frontend-ui-developer** - Builds user interfaces and client-side functionality
- **backend-api-developer** - Implements server-side logic, APIs, and database operations
- **bug-fixer-analyst** - Analyzes and resolves bugs, performance issues, and errors
- **qa-test-automation** - Creates comprehensive test suites and ensures code quality
- **performance-optimizer** - Reviews and optimizes code for speed and efficiency

## Default Technology Stack

### Frontend Stack (Build Frontend First)
1. **Vue 3** - Primary JavaScript framework
2. **Vite** - Build tool and development server
3. **PrimeVue** - CSS framework and icons (**Use First Priority**)
4. **TailwindCSS** - Backup CSS framework (only if PrimeVue cannot handle requirements)
5. **Lucide** - Backup icon library (only if PrimeVue icons insufficient)
6. **Google Fonts** - Self-hosted for optimal performance

### Backend Stack
1. **Laravel PHP** - Backend framework
2. **MySQL** - Database
3. **Eloquent ORM** - Database object-relational mapping

### DevOps & Hosting
1. **GitHub** - Version control and CI/CD pipeline
2. **Hostinger** - Production hosting platform

## Workflow Process

### 1. Initial Project Setup
The **project-coordinator-researcher** will:
- Create a **Project Requirements Document (PRD)** in markdown format
- Generate a detailed **Tasks List** in markdown format
- Assign specific tasks to appropriate agents with clear, detailed instructions

### 2. Task Management
- All tasks must be highly detailed with specific requirements
- Each task is assigned to the most suitable agent
- Tasks are marked as complete only after verification by **project-coordinator-researcher**
- Progress tracking occurs in groups of completed tasks

### 3. Technology Stack Approval Process
- **Default stack must be used whenever possible**
- If alternative technologies are needed:
  - Agent must request permission from user
  - Provide detailed reasoning for the change
  - Wait for explicit approval before proceeding
- Only use alternatives when default stack cannot efficiently handle requirements

### 4. Quality Assurance
- **project-coordinator-researcher** verifies all completed work
- Tasks are only marked complete after thorough review
- Any issues are reassigned to appropriate agents for resolution

## Communication Protocol

### Primary Contact
- **All user communication goes through project-coordinator-researcher**
- This agent serves as the single point of contact and project manager
- Other agents communicate findings and results through the coordinator

### Decision Making
- Technology stack changes require user approval
- Major architectural decisions are presented with research and recommendations
- Alternative approaches are only suggested when default stack limitations are encountered

## Deliverables Structure

### Required Documents
1. **PRD.md** - Project Requirements Document (created first)
2. **TASKS.md** - Detailed task breakdown with agent assignments
3. **PROGRESS.md** - Task completion tracking and status updates

### Code Organization
- Frontend-first development approach
- Clear separation between frontend and backend components
- Comprehensive documentation for all implementations
- Test coverage for all critical functionality

## Agent Responsibilities Summary

| Agent | Primary Focus | When to Engage |
|-------|--------------|----------------|
| project-coordinator-researcher | Project management, research, communication | Always (default contact) |
| system-architect | Technical design, architecture planning | Project start, major feature planning |
| frontend-ui-developer | Vue 3 + PrimeVue implementation | Frontend development phases |
| backend-api-developer | Laravel + MySQL implementation | Backend development phases |
| bug-fixer-analyst | Error resolution, debugging | When issues are identified |
| qa-test-automation | Testing, quality assurance | After feature completion |
| performance-optimizer | Code optimization, performance tuning | After core functionality complete |

## Success Criteria

- Default technology stack utilized unless explicitly approved otherwise
- All tasks completed with verification from project-coordinator-researcher
- Frontend-first development approach maintained
- Clear documentation and progress tracking throughout project lifecycle
- High-quality, performant, and maintainable code delivery