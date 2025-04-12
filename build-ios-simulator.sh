#!/bin/bash
# Script to build an iOS simulator app with EAS

# Check for Expo CLI
if ! command -v expo &> /dev/null; then
    echo "Installing Expo CLI..."
    npm install -g expo-cli
fi

# Check for EAS CLI
if ! command -v eas &> /dev/null; then
    echo "Installing EAS CLI..."
    npm install -g eas-cli
fi

# Make sure we have the local dependencies
echo "Installing local dependencies..."
npm install

# Login to Expo (will prompt for credentials)
echo "Logging in to Expo..."
npx expo login

# Initialize EAS project
echo "Initializing EAS project..."
npx eas-cli project:init

# Build for iOS simulator
echo "Building for iOS simulator..."
npx eas-cli build --platform ios --profile ios-simulator

echo "Build process initiated. Follow the instructions in the terminal to complete the process."
echo "When the build completes, you can run it on your iOS simulator." 