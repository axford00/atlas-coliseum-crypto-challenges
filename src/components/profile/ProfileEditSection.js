// components/profile/ProfileEditSection.js
import { StyleSheet, Text, TextInput, View } from 'react-native';
import FalloutButton from '../ui/FalloutButton';
import { colors } from '../../theme/colors';

const ProfileEditSection = ({ 
  currentProfile,
  isEditing,
  setIsEditing,
  profileText,
  setProfileText,
  saving,
  handleSaveProfile
}) => {
  return (
    <>
      {currentProfile && !isEditing ? (
        <View style={styles.currentProfileContainer}>
          <Text style={styles.currentProfileTitle}>Your Profile:</Text>
          <Text style={styles.currentProfileText}>{currentProfile}</Text>
          
          <FalloutButton
            text="EDIT PROFILE"
            onPress={() => {
              setProfileText(currentProfile);
              setIsEditing(true);
            }}
            style={styles.editButton}
            type="secondary"
          />
        </View>
      ) : null}

      {isEditing ? (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tell us about yourself:</Text>
          <Text style={styles.subLabel}>
            Include your age, fitness goals, workout frequency, experience level, preferences, etc.
            
            💡 <Text style={styles.gymTip}>Pro tip: Mention your gym (e.g., "I go to CrossFit South Brooklyn") to get their daily WODs automatically!</Text>
          </Text>
          
          <TextInput
            style={styles.textInput}
            placeholder="e.g., I'm a 30-year-old woman who wants to build strength and works out 4 times per week. I have intermediate experience and go to CrossFit South Brooklyn..."
            placeholderTextColor={colors.text.secondary}
            value={profileText}
            onChangeText={setProfileText}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
          
          <View style={styles.editButtons}>
            <FalloutButton
              text={saving ? "SAVING..." : "SAVE PROFILE"}
              onPress={handleSaveProfile}
              isLoading={saving}
              style={styles.saveButton}
            />
            
            {currentProfile ? (
              <FalloutButton
                text="CANCEL"
                onPress={() => {
                  setProfileText('');
                  setIsEditing(false);
                }}
                style={styles.cancelButton}
                type="secondary"
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  currentProfileContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.ui.border,
    marginBottom: 20,
  },
  currentProfileTitle: {
    color: colors.text.light,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  currentProfileText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  editButton: {
    marginTop: 10,
  },
  inputContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  label: {
    color: colors.text.primary,
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  subLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 18,
  },
  gymTip: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 5,
    color: colors.text.primary,
    padding: 15,
    fontSize: 16,
    height: 150,
    marginBottom: 20,
  },
  editButtons: {
    gap: 10,
  },
  saveButton: {
    marginBottom: 10,
  },
  cancelButton: {
    marginTop: 5,
  },
});

export default ProfileEditSection;