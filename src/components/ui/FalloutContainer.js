// components/ui/FalloutContainer.js
import { StyleSheet, View } from 'react-native';
import { globalStyles } from '../../theme/colors';

/**
 * A container component that applies the Fallout-inspired UI style consistently
 * across different screens of the app, including HUD corner elements
 */
export default function FalloutContainer({ children, style = {} }) {
  return (
    <View style={[styles.container, style]}>
      {/* HUD-style corner elements */}
      <View style={globalStyles.hudCorner1} />
      <View style={globalStyles.hudCorner2} />
      <View style={globalStyles.hudCorner3} />
      <View style={globalStyles.hudCorner4} />
      
      {/* Content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    position: 'relative', // For absolute positioning of HUD corners
  },
});