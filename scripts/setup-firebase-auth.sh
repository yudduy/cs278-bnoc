#!/bin/bash

# Firebase Auth Setup Script
# Automates the Firebase Authentication migration setup

echo "🚀 BNOC Firebase Auth Migration Setup"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory and navigate to root if needed
if [ -f "../package.json" ] && [ -d "../scripts" ]; then
    # We're in scripts directory, go to root
    cd ..
    print_info "Navigated to project root directory"
elif [ ! -f "package.json" ] || [ ! -d "scripts" ]; then
    print_error "Please run this script from the BNOC project root or scripts directory"
    exit 1
fi

print_info "Starting Firebase Auth migration setup..."
echo ""

# Step 1: Check Firebase CLI
print_info "Step 1: Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi
print_status "Firebase CLI found"

# Step 2: Check if logged in to Firebase
print_info "Step 2: Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    print_warning "Not logged in to Firebase. Please run: firebase login"
    read -p "Press Enter after logging in to continue..."
fi

# Step 3: Check project
print_info "Step 3: Checking Firebase project..."
CURRENT_PROJECT=$(firebase use --current 2>/dev/null | grep "active project" | cut -d' ' -f4)
if [ "$CURRENT_PROJECT" != "stone-bison-446302-p0" ]; then
    print_warning "Setting Firebase project to stone-bison-446302-p0..."
    firebase use stone-bison-446302-p0
fi
print_status "Firebase project configured"

# Step 4: Check if Authentication is enabled
print_info "Step 4: Checking Firebase Authentication..."
print_warning "Please ensure Firebase Authentication is enabled:"
echo "1. Go to: https://console.firebase.google.com/project/stone-bison-446302-p0/authentication"
echo "2. Click 'Get started' if not already enabled"
echo "3. Go to 'Sign-in method' tab"
echo "4. Enable 'Email/Password' authentication"
echo "5. Add your domains to 'Authorized domains' if needed"
echo ""
read -p "Press Enter when Firebase Authentication is enabled..."

# Step 5: Create test users
print_info "Step 5: Creating Firebase Auth test users..."
cd scripts
if node createFirebaseAuthUsers.js; then
    print_status "Test users created successfully"
else
    print_error "Failed to create test users"
    exit 1
fi

# Step 6: Run tests
print_info "Step 6: Running Firebase Auth tests..."
if node testFirebaseAuth.js test; then
    print_status "All tests passed"
else
    print_warning "Some tests failed - check output above"
fi

# Step 7: Deploy updated functions (optional)
echo ""
print_info "Step 7: Deploy Cloud Functions (optional)..."
read -p "Deploy updated Cloud Functions? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd ..
    print_info "Deploying Cloud Functions..."
    if firebase deploy --only functions; then
        print_status "Cloud Functions deployed successfully"
    else
        print_warning "Cloud Functions deployment failed"
    fi
    cd scripts
fi

# Step 8: Clean up old data (optional)
echo ""
print_info "Step 8: Clean up old user data (optional)..."
read -p "Remove old user documents from previous auth system? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if node createFirebaseAuthUsers.js --cleanup; then
        print_status "Old user data cleaned up"
    else
        print_warning "Cleanup failed or no old data found"
    fi
fi

# Final summary
echo ""
echo "🎉 Firebase Auth Migration Setup Complete!"
echo "========================================"
echo ""
print_status "Firebase Authentication is now ready for testing"
echo ""
echo "📱 Test Credentials Available:"
echo "• duy@stanford.edu / hardcarry1738"
echo "• justin@stanford.edu / abbabb6969"
echo "• kelvin@stanford.edu / seaside123"
echo "• testuser@stanford.edu / password123"
echo "• betauser@stanford.edu / testing123"
echo ""
echo "🧪 Available Commands:"
echo "• node testFirebaseAuth.js test      - Run all tests"
echo "• node testFirebaseAuth.js users     - List Firebase users"
echo "• node testFirebaseAuth.js pairings  - Create fresh pairings"
echo ""
echo "🚥 Next Steps:"
echo "1. Test user registration in the app"
echo "2. Test login with existing users"
echo "3. Test password reset functionality"
echo "4. Verify profile photo upload works"
echo "5. Check that pairings work correctly"
echo ""
print_status "Your BNOC app is ready for Firebase Auth testing!"
