// src/theme/colors.js
export const colors = {
  // Fallout-inspired gold/bronze theme
  primary: '#d9a74a',      // Gold/brass color
  secondary: '#a06235',    // Copper/bronze color
  tertiary: '#8c5425',     // Darker bronze for accents
  
  // Background colors
  background: {
    dark: '#1d302c',       // Dark teal/green background
    darker: '#0f1a17',     // Even darker shade for cards/modals
    medium: '#2a433d',     // Medium shade for secondary elements
    overlay: 'rgba(15, 26, 23, 0.7)', // Overlay for modals/forms
  },
  
  // Text colors
  text: {
    primary: '#d9a74a',    // Gold text for headings/buttons
    secondary: '#9a8555',  // Softer gold for secondary text
    light: '#e4c989',      // Lighter gold for highlights
    dark: '#5c4e32',       // Darker gold for low-emphasis text
  },
  
  // UI elements
  ui: {
    border: '#d9a74a',     // Gold border
    inputBg: 'rgba(29, 48, 44, 0.5)', // Semi-transparent input background
    cardBg: 'rgba(15, 26, 23, 0.85)', // Card background
    buttonBg: 'rgba(160, 98, 53, 0.9)', // Button background
    error: '#ff5252',      // Error red
    success: '#5cb85c',    // Success green
    warning: '#f0ad4e',    // Warning yellow
    info: '#5bc0de',       // Info blue
  },
  
  // Common colors
  common: {
    black: '#0a0a0a',
    white: '#ffffff',
    transparent: 'transparent',
  }
};

// Export common styling patterns
export const globalStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  
  // Text styles
  headerText: {
    color: colors.text.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  normalText: {
    color: colors.text.secondary,
  },
  
  // Input styles
  input: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 5,
    color: colors.text.primary,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: colors.ui.buttonBg,
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.ui.cardBg,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  
  // Error styles
  errorText: {
    color: colors.ui.error,
    marginBottom: 15,
    textAlign: 'center',
  },
  
  // Fallout-style HUD corners
  hudCorner1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 50,
    height: 50,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.primary,
  },
  hudCorner2: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 50,
    height: 50,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: colors.primary,
  },
  hudCorner3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.primary,
  },
  hudCorner4: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: colors.primary,
  },
};