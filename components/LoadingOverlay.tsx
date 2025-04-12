import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  Easing
} from 'react-native-reanimated';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  // Animation values
  const opacity = useSharedValue(0.9);
  const scale = useSharedValue(1);
  const heartBeat = useSharedValue(1);
  const glow = useSharedValue(0);

  // Setup animations
  useEffect(() => {
    // Heartbeat animation - mimics real cardiac rhythm
    heartBeat.value = withRepeat(
      withSequence(
        // First beat
        withTiming(1.15, { duration: 150, easing: Easing.bezier(0.37, 0, 0.63, 1) }),
        withTiming(0.9, { duration: 150, easing: Easing.bezier(0.37, 0, 0.63, 1) }),
        withTiming(1, { duration: 300, easing: Easing.bezier(0.37, 0, 0.63, 1) }),
        // Short pause
        withTiming(1, { duration: 200 }),
        // Second beat (slightly smaller)
        withTiming(1.08, { duration: 150, easing: Easing.bezier(0.37, 0, 0.63, 1) }),
        withTiming(0.95, { duration: 150, easing: Easing.bezier(0.37, 0, 0.63, 1) }),
        withTiming(1, { duration: 300, easing: Easing.bezier(0.37, 0, 0.63, 1) }),
        // Rest period
        withTiming(1, { duration: 600 })
      ),
      -1, // Infinite repeat
      false // Don't reverse
    );

    // Subtle container animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );

    // Glow effect that pulses with heartbeat
    glow.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 150, easing: Easing.bezier(0.37, 0, 0.63, 1) }),
        withTiming(1, { duration: 450, easing: Easing.bezier(0.37, 0, 0.63, 1) }),
        withTiming(4, { duration: 150, easing: Easing.bezier(0.37, 0, 0.63, 1) }),
        withTiming(1, { duration: 1250, easing: Easing.bezier(0.37, 0, 0.63, 1) })
      ),
      -1, // Infinite repeat
      false // Don't reverse
    );
  }, []);

  // Animated styles
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: heartBeat.value }
    ]
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.35 + (glow.value * 0.05),
    shadowRadius: 16 + glow.value,
  }));

  const messageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, containerAnimatedStyle, glowAnimatedStyle]}>
          <View style={styles.logoBackground}>
            <Animated.View style={[styles.heartContainer, heartAnimatedStyle]}>
              <View style={styles.heartShape}>
                <View style={styles.heartLeftCurve} />
                <View style={styles.heartRightCurve} />
              </View>
            </Animated.View>
            
            {/* ECG Line */}
            <View style={styles.ecgLineContainer}>
              <View style={styles.ecgLine}>
                <View style={styles.ecgLinePart} />
                <View style={styles.ecgPeak} />
                <View style={styles.ecgLinePart} />
              </View>
            </View>
          </View>
        </Animated.View>
        
        <Animated.Text style={[styles.message, messageAnimatedStyle]}>
          {message}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  content: {
    alignItems: 'center',
    gap: 32,
  },
  logoContainer: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3366',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  heartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 54,
  },
  heartShape: {
    width: 30,
    height: 30,
    backgroundColor: '#FF3366',
    transform: [{ rotate: '45deg' }],
    position: 'relative',
  },
  heartLeftCurve: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF3366',
    position: 'absolute',
    top: -15,
    left: 0,
  },
  heartRightCurve: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF3366',
    position: 'absolute',
    top: 0,
    left: -15,
  },
  ecgLineContainer: {
    position: 'absolute',
    bottom: 30,
    width: 100,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ecgLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  ecgLinePart: {
    width: 30,
    height: 1,
    backgroundColor: 'rgba(255, 51, 102, 0.2)',
  },
  ecgPeak: {
    width: 16,
    height: 16,
    borderColor: 'rgba(255, 51, 102, 0.2)',
    borderWidth: 1,
    borderRadius: 0,
    backgroundColor: 'transparent',
    transform: [{ rotate: '45deg' }],
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#333333',
    textAlign: 'center',
    letterSpacing: 0.3,
  }
});