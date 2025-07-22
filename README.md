# Veterinary Educational Platform Admin Panel

A comprehensive admin panel for managing veterinary educational resources including books, diseases, drugs, dictionary terms, and more. Built with React, TypeScript, Express.js, and integrated with external veterinary APIs.

## 🚀 One-Click Setup

### Prerequisites
- **Node.js 18+** (Download from [nodejs.org](https://nodejs.org/))
- **Git** (Download from [git-scm.com](https://git-scm.com/))

### Quick Start

1. **Clone and Setup**
   ```bash
   git clone <your-repo-url>
   cd veterinary-admin-panel
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API credentials:
   ```
   VET_API_USERNAME=your_username
   VET_API_PASSWORD=your_password
   ```

3. **Start Application**
   ```bash
   # Windows (choose one):
   start.bat           # Batch script
   start.ps1          # PowerShell script (recommended)
   
   # Mac/Linux:
   ./start.sh
   
   # Manual:
   npm run dev
   ```

4. **Access Application**
   - Open browser to: `http://localhost:5000`
   - Default login: `admin` / `admin123`

## 📋 Features

### Content Management
- **Books**: Complete CRUD operations with bulk CSV import
- **Diseases**: Multilingual disease database (English, Kurdish)
- **Drugs**: Pharmaceutical information with usage and side effects
- **Dictionary**: Veterinary terms in multiple languages
- **Slides**: Urine, stool, and other microscopic slides
- **Staff**: Team member profiles and contact information
- **Normal Ranges**: Reference values for diagnostics
- **Tutorial Videos**: Educational video content
- **Notes**: Rich text note-taking system

### System Features
- **Dark/Light Mode**: Complete theme system
- **Mobile Responsive**: Works on all device sizes
- **Search & Filter**: Advanced filtering on all content types
- **Bulk Import**: CSV upload for books with error reporting
- **Real-time Updates**: Live data refresh after operations
- **Authentication**: Secure login with session management

## 🛠 Technical Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: TanStack Query
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot reload

## 📁 Project Structure

```
veterinary-admin-panel/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── lib/          # Utilities and API client
│   │   └── hooks/        # Custom React hooks
├── server/                # Backend Express server
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   └── storage.ts        # Data storage interface
├── shared/               # Shared TypeScript schemas
└── package.json         # Dependencies and scripts
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server (frontend + backend)
npm run build        # Build for production
npm run start        # Start production server

# Utilities
npm run check        # TypeScript type checking
npm run db:push      # Push database schema changes
```

## 🌐 API Integration

The system connects to external veterinary APIs:
- **Primary API**: `https://python-database-production.up.railway.app`
- **Authentication**: JWT token-based authentication
- **Endpoints**: Books, diseases, drugs, dictionary, slides, staff, etc.

## 📝 Configuration

### Environment Variables

Create `.env` file with the following variables:

```bash
# API Authentication (Required)
VET_API_USERNAME=your_api_username
VET_API_PASSWORD=your_api_password

# Development Settings
NODE_ENV=development
PORT=5000

# Optional: Database URL for future PostgreSQL integration
DATABASE_URL=postgresql://user:password@localhost:5432/vetdb
```

### Default Categories

**Books**: surgery, medicine, anatomy, pharmacology, pathology, radiology
**Drug Classes**: Configurable through the admin interface
**Staff Roles**: Admin, Veterinarian, Assistant, Student

## 🔄 Data Import/Export

### Bulk Book Import
1. Go to Books → Bulk Import tab
2. Download sample CSV template
3. Fill with your book data (required: title, description, category)
4. Upload and import with automatic validation and error reporting

### CSV Format Example
```csv
title,description,category,cover_url,download_url
"Veterinary Anatomy","Complete anatomy guide","anatomy","https://example.com/cover.jpg","https://example.com/book.pdf"
```

## 🔐 Security

- Session-based authentication with secure token storage
- Input validation using Zod schemas
- CORS protection and security headers
- Environment variable protection for API credentials

## 🎨 Customization

### Themes
- Light/Dark mode toggle in top navigation
- CSS variables for easy color customization in `client/src/index.css`
- Consistent design system with Tailwind CSS

### Adding New Content Types
1. Define schema in `shared/schema.ts`
2. Add API endpoints in `server/routes.ts`
3. Create page component in `client/src/pages/`
4. Add navigation in sidebar

## 🚨 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill process using port 5000
npx kill-port 5000
npm run dev
```

**API Authentication Errors**
- Check `.env` file has correct VET_API_USERNAME and VET_API_PASSWORD
- Verify credentials with API provider
- Check network connectivity

**Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Database Connection Issues**
- Verify DATABASE_URL format in `.env`
- Ensure PostgreSQL is running (if using database)
- Check network connectivity to external APIs

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console logs for detailed error messages
3. Verify all environment variables are correctly set
4. Ensure Node.js version compatibility (18+)

## 🔄 Updates

The system automatically handles:
- Hot module replacement during development
- Real-time data updates after CRUD operations
- Session persistence across server restarts
- Automatic API token refresh

---

**Ready to use**: Follow the Quick Start guide above for immediate setup and deployment.