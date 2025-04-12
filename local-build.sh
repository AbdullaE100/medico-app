#!/bin/bash
# Script to build locally for iOS simulator without EAS cloud builds

# Exit on any error
set -e

echo "===== STARTING LOCAL IOS SIMULATOR BUILD ====="

# Install essential tools
echo "Step 1: Installing tools..."
npm install --global expo-cli@latest
npm install --global @expo/cli@latest
npm install --global eas-cli@latest

# Install project dependencies
echo "Step 2: Installing project dependencies..."
npm install
npm install expo-dev-client

# Create a simple development build configuration
echo "Step 3: Creating build configuration..."
cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
EOF

# Build locally for simulator
echo "Step 4: Starting local build for iOS simulator..."
npx expo run:ios --simulator

echo "===== LOCAL BUILD PROCESS COMPLETE ====="
echo "Your app should be running in the iOS simulator!" 