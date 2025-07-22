#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Veterinary Admin Panel...\n');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Error: Node.js 18 or higher is required');
  console.error(`   Current version: ${nodeVersion}`);
  console.error('   Please update Node.js from https://nodejs.org/');
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
  } else {
    // Create basic .env file
    const envContent = `# Veterinary API Credentials (Required)
VET_API_USERNAME=your_api_username
VET_API_PASSWORD=your_api_password

# Server Configuration
NODE_ENV=development
PORT=5000
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file');
  }
} else {
  console.log('✅ .env file already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  console.error('   Please run: npm install');
  process.exit(1);
}

// Check if .env has been configured
const envContent = fs.readFileSync(envPath, 'utf8');
const hasCredentials = envContent.includes('your_api_username') === false;

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');

if (!hasCredentials) {
  console.log('1. 🔑 Configure your API credentials in .env file:');
  console.log('   - Edit .env file');
  console.log('   - Replace your_api_username and your_api_password with actual values');
  console.log('   - These are required for the application to work');
}

console.log(`${hasCredentials ? '1' : '2'}. 🚀 Start the application:`);
console.log('   npm run dev');
console.log('\n3. 🌐 Open your browser to:');
console.log('   http://localhost:5000');
console.log('\n4. 🔐 Login with default credentials:');
console.log('   Username: admin');
console.log('   Password: admin123');

if (!hasCredentials) {
  console.log('\n⚠️  Important: The application requires valid API credentials to function properly.');
  console.log('   Please configure the .env file before starting the application.');
}

console.log('\n📖 For detailed documentation, see README.md');