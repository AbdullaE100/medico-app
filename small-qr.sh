#!/bin/zsh
pkill -f "node" || true
QR_CODE_MATRIX_SIZE=16 EXPO_USE_TUNNEL=true npx expo start --tunnel
