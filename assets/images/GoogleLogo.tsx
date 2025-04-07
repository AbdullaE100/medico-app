import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

interface GoogleLogoProps {
  width?: number;
  height?: number;
}

export default function GoogleLogo({ width = 24, height = 24 }: GoogleLogoProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24">
      <G fill="none" fillRule="evenodd">
        <Path
          fill="#4285F4"
          d="M23.52 12.273c0-.851-.076-1.67-.217-2.455H12v4.642h6.458a5.52 5.52 0 01-2.394 3.622v3.01h3.878c2.269-2.088 3.578-5.165 3.578-8.82z"
        />
        <Path
          fill="#34A853"
          d="M12 24c3.24 0 5.956-1.075 7.942-2.907l-3.878-3.011c-1.075.724-2.45 1.154-4.064 1.154-3.125 0-5.77-2.11-6.714-4.942H1.238v3.11A11.995 11.995 0 0012 24z"
        />
        <Path
          fill="#FBBC05"
          d="M5.286 14.294a7.213 7.213 0 01-.376-2.294c0-.796.136-1.57.376-2.294V6.597H1.238C.447 8.236 0 10.069 0 12c0 1.931.447 3.764 1.238 5.403l4.048-3.11z"
        />
        <Path
          fill="#EA4335"
          d="M12 4.764c1.762 0 3.344.605 4.587 1.794l3.442-3.442C17.951 1.187 15.236 0 12 0 7.318 0 3.294 2.694 1.238 6.597l4.048 3.11C6.23 6.873 8.874 4.764 12 4.764z"
        />
      </G>
    </Svg>
  );
} 