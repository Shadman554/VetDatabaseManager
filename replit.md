# Veterinary Educational Platform Admin Panel

## Overview

This is a comprehensive admin panel for a veterinary educational platform, providing a complete CRUD content management system for educational resources. It includes sections for books, diseases, drugs, dictionary terms, staff information, and various types of microscopic slides (urine, stool, other). The platform also manages normal ranges, tutorial videos, instruments, notes, notifications, app links, and general platform information. The project's vision is to offer a clean, modern, and efficient interface for managing educational content in the veterinary field, enhancing accessibility and organization of vital information for users.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement
- **UI/UX Decisions**: Clean, modern interface with consistent design system using CSS variables, card-based layouts, and responsive design for mobile-first experience. Dark mode implemented with theme toggle and persistent storage.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Session Management**: In-memory session storage (development setup)
- **API Design**: RESTful endpoints with JWT-like token authentication
- **Middleware**: Custom logging and error handling
- **Authentication System**: Simple username/password authentication with session-based tokens, client-side token storage in localStorage, and role-based access for admin privileges.

### Key Features
- **Content Management Modules**: Comprehensive CRUD operations for 15 distinct content types including Books, Diseases, Drugs, Dictionary, Staff, Normal Ranges, Tutorial Videos, Instruments, Notes, Urine Slides, Other Slides, Stool Slides, Notifications, App Links, and About.
- **Enhanced CRUD Interface**: Features data tables, real-time updates, in-line editing, delete confirmation, client-side form validation, and loading states.
- **SearchFilterSort Component**: Reusable component providing comprehensive search, filter, and sort functionality across all content management pages.
- **Notes System**: Redesigned with a user-friendly, section-based structure supporting multiple titled sections with content and rich text formatting.
- **Notification System**: Comprehensive management with categorization, bilingual labels, and real-time handling.
- **Error Handling & Resilience**: Implemented retry logic with progressive backoff and comprehensive error handling for network failures, ensuring robust API communication.
- **Data Flow**: Client-server communication handles authentication, content operations, data fetching via TanStack Query, and error handling with toast notifications. State management uses TanStack Query for server state, React Hook Form for form state, and custom hooks for authentication.

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

### External API Integration
- **Primary API Endpoint**: `https://python-database-production.up.railway.app`
- **Authentication**: Uses `VET_API_USERNAME` and `VET_API_PASSWORD` environment variables for secure credential management.