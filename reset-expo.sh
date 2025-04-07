#!/bin/zsh
pkill -f "node" || true
npm cache clean --force
rm -rf node_modules
rm -rf /Users/abdullaehsan/.expo
rm -f package-lock.json
npm install --legacy-peer-deps
EXPO_DEBUG=true EXPO_USE_TUNNEL=true npx expo start --clear
