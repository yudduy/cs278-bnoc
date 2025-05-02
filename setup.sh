#!/bin/bash

# BNOC React Native Setup Script for SDK 52

echo "📱 Setting up BNOC React Native project with Expo SDK 52..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Clean up node_modules and package-lock.json
echo "🧹 Cleaning up existing dependencies..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Clean up obsolete files
echo "🧹 Removing obsolete files..."
rm -f requirements.txt
rm -f upgrade-sdk.sh

# Run Expo compatibility check
echo "🔍 Running Expo compatibility check..."
npx expo-doctor

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm start' to start the development server"
echo "2. Open Expo Go on your iOS device and scan the QR code"
echo ""
echo "Note: This project now uses Expo SDK 52, which is compatible with the latest Expo Go app."
