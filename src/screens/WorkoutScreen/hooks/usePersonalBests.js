// src/screens/WorkoutScreen/hooks/usePersonalBests.js
// FIXED: Enhanced with time-based PR detection for rowing exercises

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

  // FIXED: Enhanced personal best detection with time-based support
  const checkForPersonalBest = async (exercises, getUserWorkouts) => {
    try {
      console.log('🔍 Checking for personal bests...', exercises);
      
      if (!exercises || exercises.length === 0) {
        console.log('❌ No exercises to check for PRs');
        return null;
      }

      // Get all previous workouts
      const allWorkouts = await getUserWorkouts();
      console.log('📚 Retrieved workouts for PR check:', allWorkouts?.length || 0);

      for (const exercise of exercises) {
        console.log('🔍 Checking exercise for PR:', exercise);

        // WEIGHT-BASED PR CHECK
        if (exercise.weight && exercise.weight > 0) {
          const previousBest = findPreviousBest(exercise, allWorkouts, 'weight');
          console.log('🏋️‍♂️ Previous weight best:', previousBest);

          if (!previousBest || exercise.weight > previousBest.weight) {
            const improvement = previousBest ? exercise.weight - previousBest.weight : exercise.weight;
            
            console.log('🎉 NEW WEIGHT PR DETECTED!', {
              exercise: exercise.name,
              newWeight: exercise.weight,
              previousBest: previousBest?.weight || 0,
              improvement
            });

            return {
              exercise: exercise.name,
              type: 'weight',
              weight: exercise.weight,
              unit: exercise.unit,
              improvement,
              previousBest: previousBest?.weight || 0,
              scheme: exercise.scheme
            };
          }
        }

        // TIME-BASED PR CHECK (NEW for rowing)
        if (exercise.time && exercise.distance) {
          const previousBest = findPreviousBest(exercise, allWorkouts, 'time');
          console.log('⏱️ Previous time best:', previousBest);

          const currentTimeSeconds = convertTimeToSeconds(exercise.time);
          const previousTimeSeconds = previousBest ? convertTimeToSeconds(previousBest.time) : Infinity;

          // For time-based exercises, LOWER time is better (PR)
          if (currentTimeSeconds < previousTimeSeconds && currentTimeSeconds > 0) {
            const improvementSeconds = previousTimeSeconds === Infinity ? 0 : previousTimeSeconds - currentTimeSeconds;
            const improvementTime = improvementSeconds > 0 ? convertSecondsToTime(improvementSeconds) : 'New Record';
            
            console.log('🎉 NEW TIME PR DETECTED!', {
              exercise: exercise.name,
              newTime: exercise.time,
              previousBest: previousBest?.time || 'None',
              improvement: improvementTime
            });

            return {
              exercise: exercise.name,
              type: 'time',
              time: exercise.time,
              distance: exercise.distance,
              unit: 'time',
              improvement: improvementTime,
              previousBest: previousBest?.time || 'None',
              scheme: exercise.scheme,
              // Special display formatting for time PRs
              weight: exercise.time, // Use time as "weight" for display
              improvementDisplay: improvementSeconds > 0 ? `${improvementTime} faster` : 'New Record!'
            };
          }
        }
      }

      console.log('❌ No personal bests found');
      return null;

    } catch (error) {
      console.error('❌ Error checking for personal bests:', error);
      return null;
    }
  };

  // FIXED: Helper function to find previous best for an exercise
  const findPreviousBest = (exercise, workouts, type) => {
    let previousBest = null;

    workouts.forEach(workout => {
      const exercises = workout.extractedExercises || [];
      
      exercises.forEach(prevExercise => {
        // Match exercise by name and type
        if (prevExercise.name === exercise.name && prevExercise.type === exercise.type) {
          
          if (type === 'weight' && prevExercise.weight) {
            if (!previousBest || prevExercise.weight > previousBest.weight) {
              previousBest = prevExercise;
            }
          }
          
          if (type === 'time' && prevExercise.time && prevExercise.distance === exercise.distance) {
            const prevTimeSeconds = convertTimeToSeconds(prevExercise.time);
            const bestTimeSeconds = previousBest ? convertTimeToSeconds(previousBest.time) : Infinity;
            
            if (prevTimeSeconds < bestTimeSeconds && prevTimeSeconds > 0) {
              previousBest = prevExercise;
            }
          }
        }
      });
    });

    return previousBest;
  };

  // FIXED: Helper function to convert time string to seconds
  const convertTimeToSeconds = (timeString) => {
    if (!timeString) return Infinity;
    
    const parts = timeString.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return Infinity;
  };

  // FIXED: Helper function to convert seconds to time string
  const convertSecondsToTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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