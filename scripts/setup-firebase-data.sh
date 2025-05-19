#!/bin/bash
# Make this script executable with: chmod +x scripts/setup-firebase-data.sh

# Run Firebase Test Data Setup Script
# This script sets up test data in Firebase for development

# Ensure we're in the project root directory
cd "$(dirname "$0")/.." || exit

echo "Running Firebase test data setup script..."
node scripts/setupFirebaseTestData.js
echo "Script execution complete."