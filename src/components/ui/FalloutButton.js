// components/ui/FalloutButton.js
import { memo, useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity
} from 'react-native';
import { colors, globalStyles } from '../../theme/colors';

/**
 * A styled button component that matches the Fallout-inspired theme
 * 
 * @param {Object} props
 * @param {string} props.type - "primary" or "secondary"
 * @param {string} props.text - Button text
 * @param {function} props.onPress - Button press handler
 * @param {boolean} props.isLoading - Show loading indicator
 * @param {boolean} props.disabled - Disable the button
 * @param {Object} props.style - Additional style for the button
 * @param {Object} props.textStyle - Additional style for the text
 */
const FalloutButton = memo(({ 
  type = 'primary',
  text,
  onPress,
  isLoading = false,
  disabled = false,
  style = {},
  textStyle = {}
}) => {
  // Memoize the computed styles to prevent re-creation
  const computedStyles = useMemo(() => {
    const buttonStyle = type === 'primary' 
      ? [globalStyles.primaryButton] 
      : [globalStyles.secondaryButton];
      
    const buttonTextStyle = type === 'primary' 
      ? [globalStyles.primaryButtonText] 
      : [globalStyles.secondaryButtonText];
      
    const disabledStyle = disabled || isLoading 
      ? [styles.disabledButton] 
      : [];

    return {
      button: [...buttonStyle, ...disabledStyle, style],
      text: [...buttonTextStyle, textStyle]
    };
  }, [type, disabled, isLoading, style, textStyle]);

  return (
    <TouchableOpacity
      style={computedStyles.button}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : (
        <Text style={computedStyles.text}>{text}</Text>
      )}
    </TouchableOpacity>
  );
});

// Move styles outside component to prevent re-creation
const styles = StyleSheet.create({
  disabledButton: {
    opacity: 0.7,
  },
});

FalloutButton.displayName = 'FalloutButton';

export default FalloutButton;