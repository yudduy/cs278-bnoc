import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { getAuth } from 'firebase/auth';

// Register your app for web-based authentication
WebBrowser.maybeCompleteAuthSession();

// Your Google Web Client ID from Google Cloud Console
// This is a placeholder - you'll need to replace it with your actual client ID
const GOOGLE_WEB_CLIENT_ID = '314188937187-ngm8mtpgbuko009binv5k7alak58g4h2.apps.googleusercontent.com';

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
  });

  const signInWithGoogle = async () => {
    try {
      const result = await promptAsync();
      
      if (result.type === 'success') {
        const { id_token } = result.params;
        
        const auth = getAuth();
        const credential = GoogleAuthProvider.credential(id_token);
        
        // Sign in to Firebase with Google credential
        return signInWithCredential(auth, credential);
      }
      
      return null;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  return {
    signInWithGoogle,
    request,
  };
};