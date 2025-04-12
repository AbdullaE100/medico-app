#!/bin/bash
# Script to build an iOS simulator app with EAS

# Exit on any error
set -e

echo "===== STARTING IOS SIMULATOR BUILD SETUP ====="

# Install essential tools
echo "Step 1: Installing CLI tools..."
npm install --global expo-cli@latest
npm install --global eas-cli@latest
npm install --save-dev eas-cli@latest

# Force clear any existing EAS configuration
echo "Step 2: Clearing existing EAS configuration..."
rm -f ~/.eas-cli/config.json || true 
rm -rf ~/.eas || true

# Remove project ID from app.json if it exists
echo "Step 3: Ensuring app.json is clean..."
# Create a temporary file with jq to completely remove any eas project references
if command -v jq &> /dev/null; then
  jq 'del(.expo.extra.eas)' app.json > app.json.tmp && mv app.json.tmp app.json
  jq 'del(.expo.owner)' app.json > app.json.tmp && mv app.json.tmp app.json
  jq 'del(.expo.runtimeVersion)' app.json > app.json.tmp && mv app.json.tmp app.json
  jq 'del(.expo.updates)' app.json > app.json.tmp && mv app.json.tmp app.json
else
  echo "Warning: jq not installed. Manual edit of app.json may be required."
fi

# Install dependencies
echo "Step 4: Installing dependencies..."
npm install

# Force new login to Expo
echo "Step 5: Logging in to Expo..."
npx expo logout || true
npx expo login

# Initialize the project fresh
echo "Step 6: Initializing EAS project..."
npx expo install expo-dev-client
npx eas-cli init --force

# Update eas.json with correct simulator profile
echo "Step 7: Updating eas.json with simulator configuration..."
cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {},
    "ios-simulator": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    }
  },
  "submit": {
    "production": {}
  }
}
EOF

# Build for iOS simulator
echo "Step 8: Starting iOS simulator build..."
npx eas-cli build --platform ios --profile ios-simulator --local

echo "===== BUILD PROCESS COMPLETE ====="
echo "Follow the instructions to run your app in the iOS simulator." 