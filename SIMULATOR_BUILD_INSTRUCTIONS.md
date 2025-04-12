# iOS Simulator Build Instructions

This guide will help you create and run a development build for iOS Simulator using EAS Build.

## Prerequisites

- An Expo account (sign up at [expo.dev](https://expo.dev))
- Node.js and npm installed
- Xcode installed (for running the simulator)
- iOS Simulator configured

## Build Process

### 1. Using the Automated Script

We've created a build script to streamline the process:

```bash
# Make the script executable (if not already)
chmod +x build-ios-simulator.sh

# Run the script
./build-ios-simulator.sh
```

The script will:
- Install required CLI tools if needed
- Log you into your Expo account
- Initialize your EAS project
- Start the iOS Simulator build

### 2. Manual Process

If you prefer to run commands individually:

1. **Login to Expo**:
   ```bash
   npx expo login
   ```

2. **Initialize EAS Project** (if not already done):
   ```bash
   npx eas-cli project:init
   ```

3. **Start the Build**:
   ```bash
   npx eas-cli build --platform ios --profile ios-simulator
   ```

4. Follow the prompts from EAS CLI.

## After the Build Completes

1. When the build finishes, EAS will provide a URL to download the build artifact.

2. Download the .tar.gz file and extract it to get the .app file.

3. **Install on Simulator**:
   ```bash
   # Option 1: Let EAS install it for you (recommended)
   # The CLI will prompt you to install on your simulator

   # Option 2: Manual installation
   xcrun simctl install booted /path/to/your-app.app
   ```

4. **Start Development Server**:
   ```bash
   npx expo start --dev-client
   ```

5. Open the app on your simulator. It should connect to your development server.

## Troubleshooting

- **Invalid Project ID**: If you see errors about an invalid project ID, make sure your `app.json` file doesn't have placeholder values.

- **Authentication Issues**: Ensure you're logged in with the correct Expo account.

- **Build Errors**: Check the EAS build logs for specific error details. Common issues include:
  - Missing dependencies
  - Configuration errors
  - iOS-specific setup issues

For more detailed information, refer to the [official Expo documentation](https://docs.expo.dev/build/setup/). 