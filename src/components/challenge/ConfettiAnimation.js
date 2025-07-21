// src/components/challenge/ConfettiAnimation.js
import { Animated, StyleSheet, View } from 'react-native';

const ConfettiAnimation = ({ show, animations }) => {
  if (!show) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {animations.map((piece) => (
        <Animated.View
          key={piece.id}
          style={[
            styles.confettiPiece,
            {
              left: piece.x,
              top: piece.y,
              backgroundColor: piece.color,
              width: piece.size,
              height: piece.size,
              opacity: piece.opacity,
              transform: [
                {
                  rotate: piece.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 2,
  },
});

export default ConfettiAnimation;