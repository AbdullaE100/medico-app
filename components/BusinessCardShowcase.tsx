import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import BusinessCard from './BusinessCard';
import BusinessCardHorizontal from './BusinessCardHorizontal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMING_CONFIG = { duration: 400, easing: Easing.inOut(Easing.cubic) };

interface BusinessCardShowcaseProps {
  profile: any;
  onShare?: () => void;
  onQrView?: () => void;
}

const BusinessCardShowcase: React.FC<BusinessCardShowcaseProps> = ({
  profile,
  onShare,
  onQrView,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const animationProgress = useSharedValue(0);

  // Card animations
  const mainCardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animationProgress.value,
      [0, 0.5, 1],
      [1, 0.85, 0],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      animationProgress.value,
      [0, 0.5, 1],
      [0, 30, -100],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      animationProgress.value,
      [0, 0.4, 0.6, 1],
      [1, 0, 0, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [
        { scale },
        { translateY },
      ],
    };
  });

  const secondCardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animationProgress.value,
      [0, 0.5, 1],
      [0, 0.85, 1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      animationProgress.value,
      [0, 0.5, 1],
      [100, 30, 0],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      animationProgress.value,
      [0, 0.4, 0.6, 1],
      [0, 0, 0, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [
        { scale },
        { translateY },
      ],
    };
  });

  // Indicator animations
  const indicatorLeftStyle = useAnimatedStyle(() => {
    const width = interpolate(
      animationProgress.value,
      [0, 1],
      [30, 10],
      Extrapolate.CLAMP
    );

    return {
      width,
      backgroundColor: animationProgress.value > 0.5 ? '#64748B' : '#0284C7',
    };
  });

  const indicatorRightStyle = useAnimatedStyle(() => {
    const width = interpolate(
      animationProgress.value,
      [0, 1],
      [10, 30],
      Extrapolate.CLAMP
    );

    return {
      width,
      backgroundColor: animationProgress.value < 0.5 ? '#64748B' : '#0284C7',
    };
  });

  // Rotate arrows based on current selection
  const handlePress = () => {
    const newIndex = activeIndex === 0 ? 1 : 0;
    
    animationProgress.value = withTiming(
      newIndex,
      TIMING_CONFIG,
      () => {
        setActiveIndex(newIndex);
      }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {/* Main vertical card */}
        <Animated.View 
          style={[
            styles.cardWrapper,
            { position: 'absolute', zIndex: activeIndex === 0 ? 2 : 1 },
            mainCardStyle
          ]}
        >
          <BusinessCard 
            profile={profile}
            onShare={onShare}
            onQrView={onQrView}
          />
        </Animated.View>

        {/* Horizontal card */}
        <Animated.View 
          style={[
            styles.cardWrapper,
            { position: 'absolute', zIndex: activeIndex === 1 ? 2 : 1 },
            secondCardStyle
          ]}
        >
          <BusinessCardHorizontal 
            profile={profile}
            onPress={onShare}
          />
        </Animated.View>
      </View>

      {/* Indicators and Navigation */}
      <View style={styles.navigationContainer}>
        <View style={styles.indicatorsContainer}>
          <Animated.View style={[styles.indicator, indicatorLeftStyle]} />
          <View style={styles.indicatorSpacer} />
          <Animated.View style={[styles.indicator, indicatorRightStyle]} />
        </View>
        
        <TouchableOpacity 
          style={styles.navigationButton}
          onPress={handlePress}
        >
          {activeIndex === 0 ? (
            <>
              <Text style={styles.navigationText}>Horizontal View</Text>
              <ArrowRight size={16} color="#FFFFFF" style={styles.navigationIcon} />
            </>
          ) : (
            <>
              <ArrowLeft size={16} color="#FFFFFF" style={styles.navigationIcon} />
              <Text style={styles.navigationText}>Standard View</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  cardContainer: {
    width: SCREEN_WIDTH,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  indicator: {
    height: 6,
    borderRadius: 3,
  },
  indicatorSpacer: {
    width: 8,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(2, 132, 199, 0.8)',
  },
  navigationText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  navigationIcon: {
    marginLeft: 6,
    marginRight: 6,
  },
});

export default BusinessCardShowcase; 