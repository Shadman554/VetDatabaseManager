# Veterinary Educational Platform Admin Panel

## Overview

This is a comprehensive admin panel for a veterinary educational platform built with React, TypeScript, Express.js, and Drizzle ORM. The application provides a complete CRUD content management system for educational resources including books, diseases, drugs, dictionary terms, staff information, and more. It features a clean, modern interface built with shadcn/ui components and Tailwind CSS with full create, read, update, and delete capabilities for all content types.

### Recent Updates (August 2025)
- **Simplified Notes System Implementation (2025-08-03)**: Completely redesigned notes interface with user-friendly section-based structure. Replaced complex JSON/markdown editor with intuitive form allowing multiple titled sections with content. Supports the exact format required: `{"sections":[{"title":"Section Title","content":"Content with bullet points"}]}`. Fixed SearchFilterSort component errors and improved mobile responsiveness.
- **API Authentication Migration Complete (2025-08-03)**: Successfully migrated from Replit Agent to standard Replit environment. Configured VET_API_USERNAME and VET_API_PASSWORD secrets for proper external API authentication. All API endpoints now working correctly with real-time data.
- **Notification Categories & Image URL Fix (2025-08-02)**: Added comprehensive notification categorization system with 10 content types (general, drugs, diseases, books, terminology, slides, tests, notes, instruments, normal ranges) with bilingual labels and icons. Fixed image URL validation to prevent database errors - now enforces 500-character limit and requires web URLs only (not uploaded files or base64 data).
- **Comprehensive Notification System Implementation (2025-08-02)**: Added complete notification management with admin interface for creating, viewing, marking as read, and deleting notifications. Integrated with external veterinary API endpoints for real-time notification handling, supporting Kurdish/English content and various notification types.

### Previous Updates (July 2025)
- **One-Click Deployment Package (2025-07-22)**: Created complete deployment package with automated setup scripts, documentation, and launcher for easy PC deployment
- **Bulk Import Implementation (2025-07-22)**: Fully implemented CSV bulk import for books with validation, error reporting, and sample template download
- **Drug Deletion Validation Fix (2025-07-22)**: Fixed 405 error when attempting to delete drugs with empty names by adding validation and conditional rendering of delete buttons
- **Mobile Responsiveness Complete (2025-07-22)**: Successfully implemented comprehensive mobile responsiveness across entire veterinary admin panel system
- **Drug Deletion Bug Fix (2025-07-22)**: Fixed drug deletion error by correcting API response handling - delete endpoints return JSON success messages, not booleans
- **Migration Complete (2025-07-22)**: Successfully migrated from Replit Agent to Replit environment with proper API authentication and environment variable configuration
- **API Authentication Fixed (2025-07-22)**: Configured VET_API_USERNAME and VET_API_PASSWORD environment variables, integrated dotenv for secure credential management
- **Slide Management Expansion (2025-01-22)**: Added complete CRUD support for other-slides and stool-slides endpoints with proper API schema matching external API format
- **Notes API Fix (2025-01-22)**: Corrected notes functionality to use external veterinary API endpoints instead of local storage - confirmed notes endpoints exist in external API
- **Enhanced Notes System (2025-01-20)**: Added rich text formatting with headings, sub-headings, and bullet points like Flutter app
- **Text Preview & Editing (2025-01-20)**: Added live preview mode with formatting toolbar and detailed note view dialog
- **Formatted Content Display (2025-01-20)**: Implemented text parsing to display **headings**, ## sub-headings, and * bullet points
- **Mobile Responsiveness Complete (2025-01-20)**: Fixed all responsive design issues with proper mobile-first layouts
- **Table Optimization (2025-01-20)**: Added horizontal scroll to all data tables for better mobile experience
- **Dialog Improvements (2025-01-20)**: Enhanced modal dialogs with mobile margins and responsive layouts
- **Button Layout Fixes (2025-01-20)**: Updated action buttons to stack vertically on mobile devices
- **API Connection Fixed (2025-01-20)**: Resolved API authentication errors by configuring VET_API_USERNAME and VET_API_PASSWORD secrets
- **Migration to Replit Complete (2025-01-20)**: Successfully migrated from Replit Agent to Replit environment with proper security architecture
- **Bug Fixes and UI Updates (2025-01-20)**: Fixed JSX syntax errors and API inconsistencies across pages
- **Instruments Page Fix (2025-01-20)**: Resolved API method issues for instruments page (read-only functionality)
- **SearchFilterSort Component**: Verified implementation across most pages (books, dictionary, diseases, drugs, instruments, normal ranges, notes)
- **Dark Mode Text Fix (2025-01-20)**: Fixed dark mode font colors on dashboard and throughout application for proper visibility
- **Complete Search System (2025-01-20)**: Added comprehensive search, filter, and sort functionality to ALL pages including dictionary, books, diseases, drugs, instruments, normal ranges, notes, and tutorial videos
- **Dictionary Enhancement**: Fixed pagination bug and added full filter/sort capabilities with favorites and saved status filters
- **Dark Mode Implementation**: Added complete dark mode system with theme toggle, persistent theme storage, and consistent theming across all components
- **SearchFilterSort Component**: Created reusable search component used across all content management pages
- **Theme Provider**: Implemented React context-based theme management with light/dark/system options
- **UI Consistency**: Updated all pages to use consistent search/filter/sort interface and dark mode compatible colors
- **Full CRUD Operations**: Enhanced all content management with complete Create, Read, Update, Delete functionality
- **Enhanced Books Management**: Transformed Books page with modern grid layout, edit/delete operations, and real-time data
- **API Client Enhancement**: Updated all endpoints to support proper CRUD operations using name/title identifiers
- **External API Integration**: Successfully connected to veterinary database with JWT authentication
- **Persistent Sessions**: Fixed authentication to survive server restarts
- **Real-time Data Management**: Live updates and refresh after all operations

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Session Management**: In-memory session storage (development setup)
- **API Design**: RESTful endpoints with JWT-like token authentication
- **Middleware**: Custom logging and error handling

## Key Components

### Authentication System
- Simple username/password authentication
- Session-based tokens stored in memory (server-side)
- Client-side token storage in localStorage
- Role-based access with admin privileges
- Default admin user (username: admin, password: admin123)

### Content Management Modules
1. **Books**: Complete CRUD operations for educational books with titles, descriptions, categories, and download URLs
2. **Diseases**: Full CRUD management of animal diseases with multilingual support (English, Kurdish)
3. **Drugs**: Drug database with usage information and side effects
4. **Dictionary**: Multilingual veterinary terms (English, Kurdish, Arabic)
5. **Staff**: Staff member profiles and contact information
6. **Normal Ranges**: Reference values for veterinary diagnostics
7. **Tutorial Videos**: Video content management with thumbnails
8. **Instruments**: Veterinary instrument catalog
9. **Notes**: General note-taking system with rich text formatting
10. **Urine Slides**: Microscopic urine examination slides database
11. **Other Slides**: General microscopic slides and laboratory samples
12. **Stool Slides**: Fecal examination slides and parasitology samples
13. **Notifications**: System notification management
14. **App Links**: Mobile app download links
15. **About**: Platform information management

### Enhanced CRUD Interface Features
- **Data Tables**: View all existing records in organized tables
- **Real-time Updates**: Automatic refresh after create/update/delete operations
- **Edit Functionality**: In-line editing with pre-populated forms
- **Delete Confirmation**: Safe deletion with confirmation dialogs
- **Form Validation**: Client-side validation with error messages
- **Loading States**: Visual feedback during API operations

### UI Components
- Responsive sidebar navigation with grouped sections
- Top bar with user information and logout
- Form components with validation and error handling
- Loading states and toast notifications
- Modern card-based layouts
- Consistent design system with CSS variables

## Data Flow

### Client-Server Communication
1. **Authentication Flow**: Login credentials → Express server → Session creation → Token response
2. **Content Operations**: Form submissions → API client → External veterinary API
3. **Data Fetching**: TanStack Query → API endpoints → UI updates
4. **Error Handling**: API errors → Toast notifications → User feedback

### State Management
- Server state managed by TanStack Query with caching
- Form state handled by React Hook Form
- Authentication state in custom useAuth hook
- Local UI state with React useState

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Prepared for Neon PostgreSQL integration
- **drizzle-orm**: Database ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **zod**: Runtime type validation and schema definition

### UI Dependencies
- **@radix-ui/***: Unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite bundles React application to `dist/public`
2. **Backend Build**: esbuild bundles Express server to `dist/index.js`
3. **Database**: Drizzle migrations ready for PostgreSQL deployment

### Environment Setup
- Database URL configuration through environment variables
- Production/development environment detection
- Replit-specific plugins for development environment

### External API Integration
- Primary API endpoint: `https://python-database-production.up.railway.app`
- Fallback to local endpoints for authentication
- Prepared for full API integration with consistent error handling

### Scalability Considerations
- Modular component architecture for easy feature addition
- Prepared database schema for production scaling
- Centralized API client for consistent data handling
- Type-safe data validation throughout the application

The application is structured to be easily deployable on Replit while maintaining flexibility for other hosting platforms. The codebase follows modern React patterns and includes comprehensive TypeScript definitions for maintainability.