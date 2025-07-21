// components/profile/ProfileImageSection.js
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../../firebase';
import { colors } from '../../theme/colors';
import { deleteProfileImage, uploadProfileImage } from '../../utils/imageUpload';

const ProfileImageSection = ({ 
  user, 
  profileImage, 
  setProfileImage, 
  previousImagePath, 
  setPreviousImagePath 
}) => {
  const [imageUploading, setImageUploading] = useState(false);

  const selectProfileImage = async () => {
    Alert.alert(
      'Select Profile Photo',
      'Choose how you\'d like to add your profile photo',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Photo Library', onPress: () => openImageLibrary() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      setImageUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    } finally {
      setImageUploading(false);
    }
  };

  const openImageLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library permission is required to select photos');
        return;
      }

      setImageUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      Alert.alert('Error', 'Failed to open photo library');
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageUpload = async (imageUri) => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    try {
      console.log('Starting image upload process...');
      
      if (previousImagePath) {
        console.log('Deleting previous image...');
        await deleteProfileImage(previousImagePath);
      }

      const uploadResult = await uploadProfileImage(user.uid, imageUri);
      
      if (uploadResult.success) {
        console.log('Image upload successful!');
        setProfileImage(uploadResult.downloadURL);
        setPreviousImagePath(uploadResult.path);
        
        await setDoc(doc(db, 'users', user.uid), {
          profileImage: uploadResult.downloadURL,
          profileImagePath: uploadResult.path,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        Alert.alert('Success!', 'Profile photo updated successfully!');
      } else {
        throw new Error(uploadResult.error);
      }
      
    } catch (error) {
      console.error('Image upload failed:', error);
      Alert.alert('Upload Failed', `Failed to upload image: ${error.message}`);
      setProfileImage(previousImagePath ? profileImage : null);
    }
  };

  return (
    <View style={styles.profileImageContainer}>
      <TouchableOpacity onPress={selectProfileImage} style={styles.profileImageWrapper}>
        {profileImage ? (
          <>
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
            {imageUploading && (
              <View style={styles.uploadingOverlay}>
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileImagePlaceholderText}>📷</Text>
            <Text style={styles.profileImagePlaceholderSubText}>
              {imageUploading ? 'Uploading...' : 'Add Photo'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primary,
    padding: 3,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 57,
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 57,
    backgroundColor: colors.ui.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ui.border,
    borderStyle: 'dashed',
  },
  profileImagePlaceholderText: {
    fontSize: 24,
    marginBottom: 4,
  },
  profileImagePlaceholderSubText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 57,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ProfileImageSection;