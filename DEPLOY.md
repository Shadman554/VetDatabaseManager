# 🚀 One-Click Deployment Guide

## Quick Start for Your PC

### Method 1: Windows (One-Click)
1. Double-click `start.bat`
2. Follow the prompts to configure API credentials
3. Application opens at `http://localhost:5000`

### Method 2: Mac/Linux (One-Click)
1. Double-click `start.sh` or run in terminal: `./start.sh`
2. Follow the prompts to configure API credentials
3. Application opens at `http://localhost:5000`

### Method 3: Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env with your credentials
# VET_API_USERNAME=your_username
# VET_API_PASSWORD=your_password

# 4. Start application
npm run dev
```

## 🔑 API Credentials Setup

Edit the `.env` file with your actual credentials:

```bash
VET_API_USERNAME=your_actual_username
VET_API_PASSWORD=your_actual_password
```

**Where to get credentials:**
- Contact your veterinary API provider
- Or use the credentials provided by your system administrator

## 🌐 Access the Application

1. **Web Interface**: `http://localhost:5000`
2. **Default Login**: 
   - Username: `admin`
   - Password: `admin123`

## 📋 System Requirements

- **Node.js 18+** (Auto-checked by setup scripts)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- **Internet connection** (for API access)

## 🛠 Troubleshooting

### Port 5000 Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### API Connection Issues
1. Verify credentials in `.env` file
2. Check internet connection
3. Confirm API endpoint is accessible

### Dependencies Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🔄 Production Deployment

For production deployment:

```bash
# Build the application
npm run build

# Start production server
npm start
```

The application will be available at the configured port (default: 5000).

## 📞 Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review console logs for error details
3. Ensure all prerequisites are installed
4. Verify API credentials are correct

---

**Ready to deploy**: Use any of the one-click methods above to get started immediately.