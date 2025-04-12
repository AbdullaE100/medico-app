import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  withDelay,
  Easing
} from 'react-native-reanimated';
import Svg, { Path, G, Circle } from 'react-native-svg';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  // Animation values
  const stethoscopeScale = useSharedValue(1);
  const heartbeatOpacity = useSharedValue(0.6);
  const heartbeatScale = useSharedValue(1);
  const lineProgress = useSharedValue(0);

  // Setup animations
  useEffect(() => {
    // Stethoscope subtle bounce
    stethoscopeScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );

    // Heartbeat animation
    const animateHeartbeat = () => {
      heartbeatScale.value = withSequence(
        withTiming(1.3, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 150, easing: Easing.inOut(Easing.ease) }),
        withDelay(
          100,
          withTiming(1.3, { duration: 150, easing: Easing.out(Easing.ease) })
        ),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withDelay(1000, withTiming(1, { duration: 0 }))
      );

      heartbeatOpacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0.7, { duration: 150 }),
        withDelay(
          100,
          withTiming(1, { duration: 150 })
        ),
        withTiming(0.6, { duration: 300 }),
        withDelay(1000, withTiming(0.6, { duration: 0 }))
      );
    };

    // Line animation (EKG effect)
    lineProgress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    // Start heartbeat animation and repeat it
    const interval = setInterval(animateHeartbeat, 2000);
    animateHeartbeat(); // Start immediately

    return () => clearInterval(interval);
  }, []);

  // Animated styles
  const stethoscopeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stethoscopeScale.value }]
  }));

  const heartbeatAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heartbeatOpacity.value,
    transform: [{ scale: heartbeatScale.value }]
  }));

  const lineAnimatedStyle = useAnimatedStyle(() => ({
    width: `${lineProgress.value * 100}%`
  }));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.animationContainer}>
          {/* Stethoscope Icon */}
          <Animated.View style={[styles.stethoscopeContainer, stethoscopeAnimatedStyle]}>
            <Svg width={50} height={50} viewBox="0 0 24 24" fill="none">
              <G>
                {/* Stethoscope */}
                <Path
                  d="M4.5 12.5V10C4.5 6.5 7.5 3.5 11 3.5C14.5 3.5 17.5 6.5 17.5 10V12.5"
                  stroke="#0066CC"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M17.5 11.5C17.5 12.5 18.5 13.5 19.5 13.5C20.5 13.5 21.5 12.5 21.5 11.5C21.5 10.5 20.5 9.5 19.5 9.5C18.5 9.5 17.5 10.5 17.5 11.5Z"
                  stroke="#0066CC"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M13 18.5C13 19.5 14 20.5 15 20.5C16 20.5 17 19.5 17 18.5C17 17.5 16 16.5 15 16.5C14 16.5 13 17.5 13 18.5Z"
                  stroke="#0066CC"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M17.5 13.5V16.5C17.5 16.5 17.5 16.5 17.5 16.5"
                  stroke="#0066CC"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </G>
            </Svg>
          </Animated.View>

          {/* Heartbeat / EKG Line */}
          <View style={styles.heartbeatLineContainer}>
            <Animated.View style={[styles.heartbeatLine, heartbeatAnimatedStyle]}>
              <Svg height={30} width={120} viewBox="0 0 120 30">
                <Path
                  d="M0,15 L20,15 L30,5 L40,25 L50,5 L60,25 L70,15 L120,15"
                  fill="none"
                  stroke="#0066CC"
                  strokeWidth={2}
                />
              </Svg>
            </Animated.View>
          </View>

          {/* Progress line */}
          <View style={styles.progressLineContainer}>
            <Animated.View style={[styles.progressLine, lineAnimatedStyle]} />
          </View>
        </View>
        
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  animationContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stethoscopeContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  heartbeatLineContainer: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heartbeatLine: {
    height: 30,
  },
  progressLineContainer: {
    width: 120,
    height: 2,
    backgroundColor: 'rgba(0, 102, 204, 0.2)',
    borderRadius: 1,
    marginTop: 5,
  },
  progressLine: {
    height: '100%',
    backgroundColor: '#0066CC',
    borderRadius: 1,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#666666',
  },
});