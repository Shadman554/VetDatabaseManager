# Veterinary Educational Platform Admin Panel

## Overview

This is a comprehensive admin panel for a veterinary educational platform built with React, TypeScript, Express.js, and Drizzle ORM. The application provides a complete CRUD content management system for educational resources including books, diseases, drugs, dictionary terms, staff information, and more. It features a clean, modern interface built with shadcn/ui components and Tailwind CSS with full create, read, update, and delete capabilities for all content types.

### Recent Updates (July 2025)
- **Migration Completed**: Successfully migrated from Replit Agent to Replit environment
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
9. **Notes**: General note-taking system
10. **Urine Slides**: Microscopic slide database
11. **Notifications**: System notification management
12. **App Links**: Mobile app download links
13. **About**: Platform information management

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