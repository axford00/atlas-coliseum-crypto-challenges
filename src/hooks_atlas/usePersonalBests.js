// src/screens/WorkoutScreen/hooks/usePersonalBests.js
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const usePersonalBests = () => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const confettiAnimations = useRef([]);
  const animationFrame = useRef(null);

  // Confetti colors for variety
  const confettiColors = [
    '#FFD700', // Gold
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#F39C12', // Orange
    '#E74C3C', // Crimson
    '#9B59B6', // Purple
  ];

  // Generate random confetti pieces
  const generateConfetti = (count = 50) => {
    const pieces = [];
    
    for (let i = 0; i < count; i++) {
      const piece = {
        id: i,
        x: Math.random() * screenWidth,
        y: -20, // Start above screen
        vx: (Math.random() - 0.5) * 4, // Horizontal velocity
        vy: Math.random() * 3 + 2, // Vertical velocity
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        scale: Math.random() * 0.8 + 0.4, // 0.4 to 1.2
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        gravity: 0.15,
        bounce: Math.random() * 0.3 + 0.1,
        life: 1.0,
        decay: Math.random() * 0.02 + 0.005,
        // Animation values
        animatedX: new Animated.Value(Math.random() * screenWidth),
        animatedY: new Animated.Value(-20),
        animatedRotation: new Animated.Value(Math.random() * 360),
        animatedScale: new Animated.Value(Math.random() * 0.8 + 0.4),
        animatedOpacity: new Animated.Value(1),
      };
      pieces.push(piece);
    }
    
    return pieces;
  };

  // Physics update for confetti
  const updateConfettiPhysics = () => {
    setConfettiPieces(prevPieces => {
      const updatedPieces = prevPieces.map(piece => {
        // Update physics
        piece.vy += piece.gravity; // Apply gravity
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.rotationSpeed;
        piece.life -= piece.decay;

        // Bounce off sides
        if (piece.x < 0 || piece.x > screenWidth) {
          piece.vx *= -piece.bounce;
          piece.x = Math.max(0, Math.min(screenWidth, piece.x));
        }

        // Bounce off bottom (optional, can remove for pieces to fall off screen)
        if (piece.y > screenHeight) {
          piece.vy *= -piece.bounce * 0.5; // Reduce bounce intensity
          piece.y = screenHeight;
          piece.vx *= 0.8; // Add friction
        }

        // Update animated values
        piece.animatedX.setValue(piece.x);
        piece.animatedY.setValue(piece.y);
        piece.animatedRotation.setValue(piece.rotation);
        piece.animatedOpacity.setValue(Math.max(0, piece.life));

        return piece;
      });

      // Filter out dead pieces
      return updatedPieces.filter(piece => piece.life > 0 && piece.y < screenHeight + 100);
    });
  };

  // Start confetti animation loop
  const startConfettiAnimation = () => {
    const animate = () => {
      updateConfettiPhysics();
      animationFrame.current = requestAnimationFrame(animate);
    };
    animate();
  };

  // Stop confetti animation
  const stopConfettiAnimation = () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  };

  // Trigger celebration with confetti
  const triggerCelebration = (prData) => {
    console.log('🎉 Triggering celebration for PR:', prData);
    
    setCelebrationData(prData);
    setShowCelebration(true);
    
    // Generate and start confetti
    const newConfetti = generateConfetti(60); // More pieces for epic celebration
    setConfettiPieces(newConfetti);
    startConfettiAnimation();
    
    // Auto-hide celebration after 8 seconds if user doesn't close it
    setTimeout(() => {
      if (showCelebration) {
        hideCelebration();
      }
    }, 8000);
  };

  // Hide celebration and stop confetti
  const hideCelebration = () => {
    console.log('🎊 Hiding celebration');
    setShowCelebration(false);
    stopConfettiAnimation();
    
    // Clear confetti after a short delay to allow exit animation
    setTimeout(() => {
      setConfettiPieces([]);
      setCelebrationData(null);
    }, 500);
  };

  // Check for personal best in workout data
  const checkForPersonalBest = async (exercises, getUserWorkouts) => {
    if (!exercises || exercises.length === 0) {
      return null;
    }

    console.log('🏆 Checking for personal bests in exercises:', exercises);

    try {
      // Get all previous workouts
      const allWorkouts = await getUserWorkouts();
      
      // Build exercise history
      const exerciseHistory = {};
      
      allWorkouts.forEach(workout => {
        if (workout.extractedExercises) {
          workout.extractedExercises.forEach(exercise => {
            const key = `${exercise.type}_${exercise.unit}`;
            if (!exerciseHistory[key]) {
              exerciseHistory[key] = [];
            }
            exerciseHistory[key].push({
              weight: exercise.weight,
              date: workout.date || workout.createdAt,
              reps: exercise.reps,
              sets: exercise.sets
            });
          });
        }
      });

      // Check each current exercise for PRs
      for (const exercise of exercises) {
        const key = `${exercise.type}_${exercise.unit}`;
        const history = exerciseHistory[key] || [];
        
        if (history.length === 0) {
          // First time doing this exercise
          console.log(`🆕 First time doing ${exercise.name}!`);
          continue;
        }

        // Find previous best
        const previousBest = Math.max(...history.map(h => h.weight));
        
        if (exercise.weight > previousBest) {
          const improvement = exercise.weight - previousBest;
          
          console.log(`🎉 NEW PR DETECTED: ${exercise.name} ${exercise.weight}${exercise.unit} (was ${previousBest}${exercise.unit})`);
          
          return {
            exercise: exercise.name.toUpperCase(),
            weight: exercise.weight,
            unit: exercise.unit,
            improvement: improvement,
            previousBest: previousBest,
            scheme: exercise.scheme || `${exercise.sets || 1}x${exercise.reps || 1}`,
            reps: exercise.reps || 1,
            sets: exercise.sets || 1,
            date: new Date().toISOString(),
          };
        }
      }

      console.log('❌ No personal bests found');
      return null;
      
    } catch (error) {
      console.error('Error checking for personal bests:', error);
      return null;
    }
  };

  // Enhanced confetti piece renderer with physics
  const renderConfettiPiece = (piece, index) => {
    if (!piece || !piece.animatedX) return null;

    return (
      <Animated.View
        key={piece.id || index}
        style={{
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: piece.color,
          transform: [
            { translateX: piece.animatedX },
            { translateY: piece.animatedY },
            { rotate: piece.animatedRotation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })
            },
            { scale: piece.animatedScale }
          ],
          opacity: piece.animatedOpacity,
        }}
      />
    );
  };

  // Alternative confetti burst effect for special PRs
  const triggerConfettiBurst = (centerX = screenWidth / 2, centerY = screenHeight / 2) => {
    const burstPieces = [];
    
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const velocity = Math.random() * 8 + 4;
      
      const piece = {
        id: `burst_${i}`,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 2, // Slight upward bias
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        scale: Math.random() * 1.2 + 0.6,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        gravity: 0.2,
        bounce: Math.random() * 0.4 + 0.2,
        life: 1.0,
        decay: Math.random() * 0.015 + 0.008,
        animatedX: new Animated.Value(centerX),
        animatedY: new Animated.Value(centerY),
        animatedRotation: new Animated.Value(Math.random() * 360),
        animatedScale: new Animated.Value(Math.random() * 1.2 + 0.6),
        animatedOpacity: new Animated.Value(1),
      };
      
      burstPieces.push(piece);
    }
    
    setConfettiPieces(prev => [...prev, ...burstPieces]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConfettiAnimation();
    };
  }, []);

  // Auto-cleanup confetti when celebration ends
  useEffect(() => {
    if (!showCelebration) {
      stopConfettiAnimation();
    }
  }, [showCelebration]);

  return {
    // State
    showCelebration,
    celebrationData,
    confettiPieces,
    
    // Actions
    triggerCelebration,
    hideCelebration,
    checkForPersonalBest,
    triggerConfettiBurst,
    
    // Utilities
    renderConfettiPiece,
    generateConfetti,
    startConfettiAnimation,
    stopConfettiAnimation,
  };
};