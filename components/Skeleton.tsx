import React, { useEffect } from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SkeletonProps {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  marginBottom?: number;
  marginTop?: number;
  marginLeft?: number;
  marginRight?: number;
  backgroundColor?: string;
  highlightColor?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius = 4,
  marginBottom = 0,
  marginTop = 0,
  marginLeft = 0,
  marginRight = 0,
  backgroundColor = '#E2E8F0',
  highlightColor = '#F1F5F9',
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.9, { duration: 800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          marginBottom,
          marginTop,
          marginLeft,
          marginRight,
          backgroundColor,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.highlight,
          { backgroundColor: highlightColor },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
}); 