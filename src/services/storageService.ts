import firebaseApp from '../config/firebase'; // Changed to default import
import { getStorage, ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import * as ImageManipulator from 'expo-image-manipulator';
import logger from '../utils/logger';

const storage = getStorage(firebaseApp);

/**
 * Compresses an image before upload to save storage and bandwidth
 * @param imageUri The local URI of the image file.
 * @param options Optional parameters for compression
 * @returns Promise resolving to the URI of the compressed image
 */
export const compressImage = async (
  imageUri: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    resizeMode?: 'contain' | 'cover' | 'stretch';
  }
): Promise<string> => {
  try {
    // Default values with reasonable defaults
    const width = options?.width || 1080; // Default to 1080px width
    const height = options?.height;
    const quality = options?.quality || 0.8; // 80% quality
    const resizeMode = options?.resizeMode || 'contain';
    
    // Prepare resize action based on provided parameters
    const resizeAction: ImageManipulator.Action = {
      resize: {
        width,
        height,
      },
    };
    
    // If no height provided, remove it to maintain aspect ratio
    if (!height) {
      delete resizeAction.resize.height;
    }
    
    // Perform image manipulation
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [resizeAction],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    logger.debug('Image compressed successfully', {
      originalUri: imageUri,
      compressedUri: result.uri,
      width: result.width,
      height: result.height,
    });
    
    return result.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original image if compression fails
    return imageUri;
  }
};

/**
 * Uploads a user profile image to Firebase Storage
 * @param imageUri The local URI of the image file
 * @param userId The user's ID
 * @param onProgress Optional callback for upload progress
 * @returns Promise resolving to the download URL
 */
export const uploadUserProfileImage = async (
  imageUri: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Compress the image with profile photo-specific settings
    const compressedUri = await compressImage(imageUri, {
      width: 500, // Profile images can be smaller
      quality: 0.8,
    });
    
    // Upload to a user-specific profile path
    const path = `users/${userId}/profile.jpg`;
    
    // Use the basic upload function with the compressed image
    return await uploadImage(
      compressedUri, 
      path, 
      {
        contentType: 'image/jpeg',
        customMetadata: {
          userId,
          purpose: 'profile',
          timestamp: new Date().toISOString(),
        },
        onProgress,
      }
    );
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

/**
 * Uploads a pairing selfie to Firebase Storage
 * @param imageUri The local URI of the image file
 * @param pairingId The pairing ID
 * @param userId The user's ID who uploaded the image
 * @param isPrivate Whether the image should be private or not
 * @param onProgress Optional callback for upload progress
 * @returns Promise resolving to the download URL
 */
export const uploadPairingPhoto = async (
  imageUri: string,
  pairingId: string,
  userId: string,
  isPrivate: boolean = false,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Compress the image with pairing photo-specific settings
    const compressedUri = await compressImage(imageUri, {
      width: 1200, // Higher quality for pairing photos
      quality: 0.85,
    });
    
    // Upload to a pairing-specific path
    const fileName = `user_${userId}_${Date.now()}.jpg`;
    const path = `pairings/${pairingId}/${fileName}`;
    
    // Use the basic upload function with the compressed image
    return await uploadImage(
      compressedUri, 
      path, 
      {
        contentType: 'image/jpeg',
        customMetadata: {
          pairingId,
          userId,
          isPrivate: isPrivate.toString(),
          purpose: 'pairingPhoto',
          timestamp: new Date().toISOString(),
        },
        onProgress,
      }
    );
  } catch (error) {
    console.error('Error uploading pairing photo:', error);
    throw error;
  }
};

/**
 * Generic function to upload any image to Firebase Storage
 * @param uri The local URI of the image file
 * @param storagePath The path in Firebase Storage to upload to
 * @param options Additional options for the upload
 * @returns Promise resolving to the download URL
 */
export const uploadImage = async (
  uri: string,
  storagePath: string,
  options?: {
    contentType?: string;
    customMetadata?: Record<string, string>;
    onProgress?: (progress: number) => void;
  }
): Promise<string> => {
  try {
    // Create a storage reference
    const storageRef = ref(storage, storagePath);
    
    // Fetch the image as a blob
    const response = await fetch(uri);
  const blob = await response.blob();
    
    // Set up the upload task
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: options?.contentType || 'image/jpeg',
      customMetadata: options?.customMetadata,
    });
    
    // Return a promise that resolves with the download URL when the upload completes
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
          // Calculate and report progress
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          options?.onProgress?.(progress);
      },
      (error) => {
          // Handle errors
        console.error('Upload failed:', error);
        reject(error);
      },
      async () => {
          // Upload completed successfully, get the download URL
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
            console.error('Error getting download URL:', error);
          reject(error);
        }
      }
    );
  });
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Lists all images in a directory in Firebase Storage
 * @param path The path in Firebase Storage
 * @returns Promise resolving to an array of download URLs
 */
export const listImages = async (path: string): Promise<string[]> => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    
    const urlPromises = result.items.map((itemRef) => getDownloadURL(itemRef));
    return await Promise.all(urlPromises);
  } catch (error) {
    console.error('Error listing images:', error);
    throw error;
  }
};

/**
 * Deletes an image from Firebase Storage
 * @param url The download URL of the image
 * @returns Promise resolving when the image is deleted
 */
export const deleteImage = async (url: string): Promise<void> => {
  try {
    // Get the storage reference from the URL
    const imageRef = ref(storage, url);
    
    // Delete the file
    await deleteObject(imageRef);
    logger.info('Image deleted successfully');
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export default {
  uploadImage,
  uploadUserProfileImage,
  uploadPairingPhoto,
  compressImage,
  listImages,
  deleteImage,
}; 