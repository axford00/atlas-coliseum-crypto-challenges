// utils/imageUpload.js
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase';

export const uploadProfileImage = async (userId, imageUri) => {
  try {
    console.log('Starting image upload for user:', userId);
    
    // Create a unique filename
    const timestamp = Date.now();
    const filename = `profile_${timestamp}.jpg`;
    const storageRef = ref(storage, `profile_images/${userId}/${filename}`);
    
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    console.log('Uploading image blob, size:', blob.size);
    
    // Upload the image
    const snapshot = await uploadBytes(storageRef, blob);
    console.log('Image uploaded successfully');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);
    
    return {
      success: true,
      downloadURL,
      filename,
      path: snapshot.ref.fullPath
    };
    
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const deleteProfileImage = async (imagePath) => {
  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
    console.log('Previous profile image deleted');
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: error.message };
  }
};

export const resizeImageIfNeeded = (imageUri, maxWidth = 800, maxHeight = 800) => {
  // This is a placeholder for image resizing logic
  // In production, you might want to use expo-image-manipulator
  return imageUri;
};