#!/bin/zsh
pkill -f "node" || true
EXPO_NO_FANCY_TERMINAL=1 npx expo start --tunnel
