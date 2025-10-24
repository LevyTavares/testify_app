import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Image,
} from 'react-native';

const SplashScreen = () => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const opacityValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.9)).current;
  const translateYValue = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (isImageLoaded) {
      Animated.parallel([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(translateYValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]).start();
    }
  }, [isImageLoaded, opacityValue, scaleValue, translateYValue]);

  return (
    <View style={styles.splashContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#346a74" />

      <Animated.View
        style={{
          opacity: opacityValue,
          transform: [{ scale: scaleValue }, { translateY: translateYValue }],
        }}>
        <View style={styles.iconContainer}>
          <Image
            // Lembre-se que você moveu as imagens para "assets/images/"
            source={require('../assets/images/testify-icon.png')} 
            style={styles.iconImage}
            onLoad={() => setIsImageLoaded(true)}
          />
        </View>
      </Animated.View>
    </View>
  );
};

// Estilos 100% copiados do SplashScreen.js
const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#346a74',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
  },
  iconImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export default SplashScreen;