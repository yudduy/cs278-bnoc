

echo "📱 Setting up BNOC React Native project with Expo SDK 52..."

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit /b 1
)

REM Clean up node_modules and package-lock.json
echo "🧹 Cleaning up existing dependencies..."
if exist node_modules (
    rd /s /q node_modules
)
if exist package-lock.json (
    del package-lock.json
)

REM Install dependencies
echo "📦 Installing dependencies..."
npm install

REM Clean up obsolete files
echo "🧹 Removing obsolete files..."
if exist requirements.txt (
    del requirements.txt
)
if exist upgrade-sdk.sh (
    del upgrade-sdk.sh
)

REM Run Expo compatibility check
echo "🔍 Running Expo compatibility check..."
npx expo-doctor

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm start' to start the development server"
echo "2. Open Expo Go on your iOS or Android device and scan the QR code"
echo ""
echo "Note: This project now uses Expo SDK 52, which is compatible with the latest Expo Go app."

exit /b 0