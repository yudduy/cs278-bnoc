import firebaseApp from '../config/firebase'; // Changed to default import
import { getStorage, ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const storage = getStorage(firebaseApp);

/**
 * Uploads an image to Firebase Storage.
 * @param imageUri The local URI of the image file.
 * @param userId The ID of the user uploading the image.
 * @param onProgress Optional callback to track upload progress.
 * @returns Promise resolving to the download URL of the uploaded image.
 */
export const uploadImage = async (
  imageUri: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!userId) {
    throw new Error('User ID is required to upload an image.');
  }

  const response = await fetch(imageUri);
  const blob = await response.blob();

  const fileExtension = imageUri.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExtension}`;
  const storagePath = `photos/${userId}/${fileName}`;
  const imageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(imageRef, blob);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error('Failed to get download URL:', error);
          reject(error);
        }
      }
    );
  });
};

/**
 * Retrieves all photo URLs for a given user.
 * Sorts by upload time descending (most recent first) based on filename convention.
 * @param userId The ID of the user.
 * @returns Promise resolving to an array of photo download URLs.
 */
export const getUserPhotos = async (userId: string): Promise<string[]> => {
  if (!userId) {
    console.warn('No user ID provided to getUserPhotos');
    return [];
  }
  const userPhotosRef = ref(storage, `photos/${userId}`);
  try {
    const result = await listAll(userPhotosRef);
    const urlPromises = result.items.map((itemRef) => getDownloadURL(itemRef));
    const urls = await Promise.all(urlPromises);

    // Sort URLs: filenames start with timestamp, so string sort works for recency
    // Caveat: this relies on filenames like YYYY-MM-DDTHH:MM:SS.sssZ_name.jpg or timestamp_name.jpg
    // The current implementation uses Date.now() which is fine for sorting.
    return urls.sort((a, b) => {
      const fileA = a.split('/').pop()?.split('?')[0] || '';
      const fileB = b.split('/').pop()?.split('?')[0] || '';
      return fileB.localeCompare(fileA); // Sorts descending by filename
    });
  } catch (error) {
    console.error('Error fetching user photos:', error);
    return [];
  }
};

/**
 * Retrieves the most recent photo URL for a given user.
 * @param userId The ID of the user.
 * @returns Promise resolving to the download URL of the most recent photo, or null if none found.
 */
export const getMostRecentUserPhoto = async (userId: string): Promise<string | null> => {
  const photos = await getUserPhotos(userId);
  return photos.length > 0 ? photos[0] : null;
};

/**
 * Deletes a photo from Firebase Storage given its download URL.
 * This is a more complex operation as it requires parsing the storage path from the URL.
 * @param photoUrl The download URL of the photo to delete.
 * @returns Promise resolving when deletion is complete.
 */
export const deleteUserPhotoByUrl = async (photoUrl: string): Promise<void> => {
  try {
    // Firebase storage download URLs have a specific format.
    // We need to extract the path from the URL.
    // Example URL: https://firebasestorage.googleapis.com/v0/b/your-project-id.appspot.com/o/photos%2FuserId%2Ffilename.jpg?alt=media&token=...
    // The path is photos/userId/filename.jpg (after decoding %2F to /)
    const decodedUrl = decodeURIComponent(photoUrl);
    const pathRegex = /\/o\/(.*?)\?alt=media/;
    const match = decodedUrl.match(pathRegex);

    if (match && match[1]) {
      const filePath = match[1];
      const photoRef = ref(storage, filePath);
      await deleteObject(photoRef);
      console.log('Photo deleted successfully:', filePath);
    } else {
      throw new Error('Could not extract file path from URL.');
    }
  } catch (error) {
    console.error('Error deleting photo by URL:', error);
    throw error; // Re-throw to allow caller to handle
  }
}; 