# Implementation Phase 4: Testing and Optimization

This final phase focuses on rigorously testing the Daily Meetup Selfie app, optimizing performance, implementing monitoring, and preparing for release. With all core features in place from the previous phases, we'll now ensure the app is reliable, performant, and ready for user adoption.

## Performance Optimization

### Firebase Query Optimization

1. **Optimize Feed Queries**:
   ```typescript
   // Enhanced getFeed function with optimized queries
   const getFeed = async (
     userId: string, 
     limit: number, 
     startAfter?: Timestamp
   ): Promise<{ pairings: Pairing[], lastVisible: Timestamp | null, hasMore: boolean }> => {
     const db = firebase.firestore();
     
     try {
       // Use denormalized feed collection for faster retrieval
       let query = db.collection('userFeeds')
         .doc(userId)
         .collection('items')
         .orderBy('date', 'desc')
         .limit(limit);
       
       // Apply cursor if provided
       if (startAfter) {
         query = query.startAfter(startAfter);
       }
       
       const snapshot = await query.get();
       
       if (snapshot.empty) {
         return { pairings: [], lastVisible: null, hasMore: false };
       }
       
       // Get the last visible item for next pagination
       const lastVisible = snapshot.docs[snapshot.docs.length - 1].data().date;
       
       // Get all pairingIds to fetch in a single batch
       const pairingIds = snapshot.docs.map(doc => doc.data().pairingId);
       
       // Batch get all pairings in a single query
       const pairingRefs = pairingIds.map(id => db.collection('pairings').doc(id));
       const pairingSnapshots = await db.getAll(...pairingRefs);
       
       // Process pairings in the correct order
       const pairingsMap = new Map();
       pairingSnapshots.forEach(snap => {
         if (snap.exists) {
           pairingsMap.set(snap.id, { id: snap.id, ...snap.data() });
         }
       });
       
       // Maintain the original order from the feed items
       const pairings = pairingIds
         .map(id => pairingsMap.get(id))
         .filter(Boolean) as Pairing[];
       
       return {
         pairings,
         lastVisible,
         hasMore: pairings.length === limit,
       };
     } catch (error) {
       console.error('Error getting feed:', error);
       throw error;
     }
   };
   ```

2. **Reduce Document Size**:
   ```typescript
   // Implement a function to clean up large pairing documents
   const splitPairingComments = async (pairingId: string): Promise<void> => {
     const db = firebase.firestore();
     const batch = db.batch();
     
     try {
       // Get the pairing document
       const pairingDoc = await db.collection('pairings').doc(pairingId).get();
       
       if (!pairingDoc.exists) {
         throw new Error('Pairing not found');
       }
       
       const pairingData = pairingDoc.data() as Pairing;
       const comments = pairingData.comments || [];
       
       // If comments section is large, move to a subcollection
       if (comments.length > 20) {
         // Create a comments subcollection
         for (const comment of comments) {
           const commentRef = db.collection('pairings')
             .doc(pairingId)
             .collection('comments')
             .doc(comment.id);
             
           batch.set(commentRef, comment);
         }
         
         // Update the main document to remove comments array
         batch.update(db.collection('pairings').doc(pairingId), {
           comments: [],
           hasCommentsCollection: true,
         });
         
         await batch.commit();
       }
     } catch (error) {
       console.error('Error splitting pairing comments:', error);
       throw error;
     }
   };
   
   // Update getComments function to handle both formats
   const getComments = async (pairingId: string): Promise<Comment[]> => {
     const db = firebase.firestore();
     
     try {
       // Get the pairing document
       const pairingDoc = await db.collection('pairings').doc(pairingId).get();
       
       if (!pairingDoc.exists) {
         throw new Error('Pairing not found');
       }
       
       const pairingData = pairingDoc.data() as Pairing;
       
       // Check if comments are in a subcollection
       if (pairingData.hasCommentsCollection) {
         const commentsSnapshot = await db.collection('pairings')
           .doc(pairingId)
           .collection('comments')
           .orderBy('createdAt', 'asc')
           .get();
           
         return commentsSnapshot.docs.map(doc => ({
           id: doc.id,
           ...doc.data(),
         })) as Comment[];
       } else {
         // Return comments from the main document
         return pairingData.comments || [];
       }
     } catch (error) {
       console.error('Error getting comments:', error);
       throw error;
     }
   };
   ```

3. **Optimize Storage Access**:
   ```typescript
   // Implement image caching and resizing
   const getOptimizedImageURL = (
     originalURL: string, 
     width: number = 600
   ): string => {
     // If it's already a resized URL, return as is
     if (originalURL.includes('_resized_')) {
       return originalURL;
     }
     
     // Extract the storage path from the URL
     const storagePath = extractStoragePath(originalURL);
     
     // Generate a resized image URL
     return `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${encodeURIComponent(storagePath)}_resized_${width}?alt=media`;
   };
   
   // Create a Cloud Function to generate resized images
   // In Firebase Cloud Functions
   export const generateResizedImage = functions.storage
     .object()
     .onFinalize(async (object) => {
       // Skip if this is already a resized image
       if (object.name?.includes('_resized_')) {
         return null;
       }
       
       // Only process pairing images
       if (!object.name?.startsWith('pairings/')) {
         return null;
       }
       
       // Generate different sizes (600px and 1200px widths)
       const sizes = [600, 1200];
       
       // Process each size
       for (const size of sizes) {
         try {
           // Download original
           const tempFilePath = path.join(os.tmpdir(), object.name || '');
           await bucket.file(object.name || '').download({ destination: tempFilePath });
           
           // Resize using Sharp
           const resizedFileName = `${object.name}_resized_${size}`;
           const resizedFilePath = path.join(os.tmpdir(), resizedFileName);
           
           await sharp(tempFilePath)
             .resize(size)
             .toFile(resizedFilePath);
           
           // Upload resized image
           await bucket.upload(resizedFilePath, {
             destination: resizedFileName,
             metadata: {
               contentType: object.contentType,
               metadata: {
                 originalFile: object.name,
                 width: size,
               },
             },
           });
           
           // Clean up temp files
           fs.unlinkSync(tempFilePath);
           fs.unlinkSync(resizedFilePath);
         } catch (error) {
           console.error('Error resizing image:', error);
         }
       }
       
       return null;
     });
   ```

### React Native Performance Optimization

1. **Component Memoization**:
   ```typescript
   // PairingCard.tsx - Apply memoization
   import React, { useState, useCallback, memo } from 'react';
   
   // Memoize the component to prevent unnecessary re-renders
   const PairingCard: React.FC<{ pairing: Pairing }> = memo(({ pairing }) => {
     // Component implementation
     // ...
     
     // Use useCallback for functions passed to child components
     const handleLike = useCallback(() => {
       toggleLikePairing(pairing.id);
     }, [pairing.id, toggleLikePairing]);
     
     // Use useCallback for comment submission
     const handleComment = useCallback(() => {
       if (comment.trim() && currentUser) {
         addCommentToPairing(pairing.id, comment);
         setComment('');
       }
     }, [comment, currentUser, pairing.id, addCommentToPairing]);
     
     // Rest of component...
   }, (prevProps, nextProps) => {
     // Custom comparison function to determine if rerender is needed
     // Only re-render if important props have changed
     return (
       prevProps.pairing.id === nextProps.pairing.id &&
       prevProps.pairing.likes === nextProps.pairing.likes &&
       prevProps.pairing.comments?.length === nextProps.pairing.comments?.length &&
       prevProps.pairing.status === nextProps.pairing.status
     );
   });
   ```

2. **List Performance Optimization**:
   ```typescript
   // FeedScreen.tsx - Optimize FlatList
   const FeedScreen: React.FC = () => {
     // Component state and functions
     // ...
     
     // Memoize the render item function to prevent recreation on each render
     const renderItem = useCallback(({ item }: { item: Pairing }) => (
       <PairingCard pairing={item} />
     ), []);
     
     // Memoize the key extractor
     const keyExtractor = useCallback((item: Pairing) => item.id, []);
     
     // Create memoized empty component
     const EmptyFeedComponent = useCallback(() => (
       !loading ? <EmptyFeed /> : null
     ), [loading]);
     
     // Create memoized footer component
     const FooterComponent = useCallback(() => (
       loading && !refreshing ? <ActivityIndicator /> : null
     ), [loading, refreshing]);
     
     return (
       <View style={styles.container}>
         <FlatList
           data={pairings}
           renderItem={renderItem}
           keyExtractor={keyExtractor}
           refreshControl={
             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#990000" />
           }
           onEndReached={handleEndReached}
           onEndReachedThreshold={0.5}
           ListFooterComponent={FooterComponent}
           ListEmptyComponent={EmptyFeedComponent}
           // Optimize performance with these props
           removeClippedSubviews={true}
           maxToRenderPerBatch={5}
           initialNumToRender={5}
           updateCellsBatchingPeriod={50}
           windowSize={5}
         />
       </View>
     );
   };
   ```

3. **Image Loading Optimization**:
   ```typescript
   // ImageWithLoading.tsx - Progressive image loading component
   const ImageWithLoading: React.FC<{
     uri: string;
     style: StyleProp<ImageStyle>;
     resizeMode?: ImageResizeMode;
   }> = memo(({ uri, style, resizeMode = 'cover' }) => {
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(false);
     
     // Get thumbnail URL for initial quick loading
     const thumbnailUri = useMemo(() => {
       return getOptimizedImageURL(uri, 60); // Very small initial load
     }, [uri]);
     
     // Get optimized main image URL
     const optimizedUri = useMemo(() => {
       return getOptimizedImageURL(uri, 600); // Properly sized for display
     }, [uri]);
     
     return (
       <View style={[styles.container, style]}>
         {/* Show loading spinner initially */}
         {loading && !error && (
           <View style={[styles.loadingContainer, style]}>
             <ActivityIndicator color="#990000" />
           </View>
         )}
         
         {/* Show error placeholder if image fails to load */}
         {error && (
           <View style={[styles.errorContainer, style]}>
             <Text style={styles.errorText}>Unable to load image</Text>
           </View>
         )}
         
         {/* Progressive image loading */}
         <View style={[styles.imageContainer, style]}>
           {/* Thumbnail image (loads quickly) */}
           <Image
             source={{ uri: thumbnailUri }}
             style={[StyleSheet.absoluteFill, { opacity: loading ? 1 : 0 }]}
             resizeMode={resizeMode}
             blurRadius={3}
           />
           
           {/* Main image (higher quality) */}
           <Image
             source={{ uri: optimizedUri }}
             style={[StyleSheet.absoluteFill, { opacity: loading ? 0 : 1 }]}
             resizeMode={resizeMode}
             onLoadStart={() => setLoading(true)}
             onLoad={() => setLoading(false)}
             onError={() => {
               setLoading(false);
               setError(true);
             }}
           />
         </View>
       </View>
     );
   });
   ```

## Error Monitoring and Logging

### Crash Reporting Implementation

1. **Configure Firebase Crashlytics**:
   ```typescript
   // In app entry point
   import crashlytics from '@react-native-firebase/crashlytics';
   
   // Enable Crashlytics collection
   await firebase.crashlytics().setCrashlyticsCollectionEnabled(true);
   
   // Set user ID for crash reports when authenticated
   useEffect(() => {
     const setUserForCrashlytics = async () => {
       if (auth.currentUser) {
         await crashlytics().setUserId(auth.currentUser.uid);
         await crashlytics().setAttributes({
           username: auth.currentUser.displayName || 'unknown',
           email: auth.currentUser.email || 'unknown',
         });
       }
     };
     
     setUserForCrashlytics();
   }, [auth.currentUser]);
   ```

2. **Custom Error Boundary**:
   ```typescript
   // ErrorBoundary.tsx
   import React, { Component, ErrorInfo, ReactNode } from 'react';
   import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
   import crashlytics from '@react-native-firebase/crashlytics';
   
   interface Props {
     children: ReactNode;
     fallback?: ReactNode;
   }
   
   interface State {
     hasError: boolean;
     error: Error | null;
     errorInfo: ErrorInfo | null;
   }
   
   class ErrorBoundary extends Component<Props, State> {
     constructor(props: Props) {
       super(props);
       this.state = {
         hasError: false,
         error: null,
         errorInfo: null,
       };
     }
     
     static getDerivedStateFromError(error: Error): State {
       return {
         hasError: true,
         error,
         errorInfo: null,
       };
     }
     
     componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
       // Log error to Crashlytics
       crashlytics().recordError(error);
       
       // Update state with error details
       this.setState({
         error,
         errorInfo,
       });
       
       // Log to console for development
       console.error('Error caught by boundary:', error, errorInfo);
     }
     
     resetError = (): void => {
       this.setState({
         hasError: false,
         error: null,
         errorInfo: null,
       });
     };
     
     render(): ReactNode {
       if (this.state.hasError) {
         // Custom fallback UI
         return this.props.fallback || (
           <View style={styles.container}>
             <Text style={styles.title}>Something went wrong</Text>
             <Text style={styles.message}>
               The app encountered an unexpected error. Please try again.
             </Text>
             <TouchableOpacity 
               style={styles.button}
               onPress={this.resetError}
             >
               <Text style={styles.buttonText}>Try Again</Text>
             </TouchableOpacity>
           </View>
         );
       }
       
       return this.props.children;
     }
   }
   
   // Apply error boundaries to key components
   const SafeScreen: React.FC<{ children: ReactNode, name: string }> = ({ children, name }) => (
     <ErrorBoundary
       fallback={
         <View style={styles.container}>
           <Text style={styles.title}>Error in {name}</Text>
           <Text style={styles.message}>
             This screen encountered an error. Please try again.
           </Text>
           <TouchableOpacity 
             style={styles.button}
             onPress={() => navigation.goBack()}
           >
             <Text style={styles.buttonText}>Go Back</Text>
           </TouchableOpacity>
         </View>
       }
     >
       {children}
     </ErrorBoundary>
   );
   ```

3. **Global Error Handler**:
   ```typescript
   // In app entry point
   import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';
   
   // Handle JS errors
   setJSExceptionHandler((error, isFatal) => {
     // Log to Crashlytics
     crashlytics().recordError(error);
     
     // Log additional context
     console.error(`JS Error: ${isFatal ? 'Fatal' : 'Non-fatal'}`, error);
     
     // For development, show an alert
     if (__DEV__) {
       Alert.alert(
         'Unexpected Error',
         `Error: ${error.message}\n\nWe've recorded this issue and will fix it soon.`,
         [{ text: 'OK' }]
       );
     }
   }, true);
   
   // Handle native errors
   setNativeExceptionHandler(
     (exceptionString) => {
       // This is a native-only handler - cannot run JS code here
     },
     false,
     true
   );
   ```

### Application Logging

1. **Enhanced Logging Service**:
   ```typescript
   // logger.ts
   import crashlytics from '@react-native-firebase/crashlytics';
   
   type LogLevel = 'debug' | 'info' | 'warn' | 'error';
   
   interface LogOptions {
     tags?: string[];
     userId?: string;
     metadata?: Record<string, any>;
   }
   
   // Base logging function
   const log = (
     level: LogLevel,
     message: string,
     options?: LogOptions
   ): void => {
     const timestamp = new Date().toISOString();
     const { tags = [], userId = '', metadata = {} } = options || {};
     
     // Format for console
     const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
     const logData = { tags, userId, ...metadata };
     
     // Log to appropriate console method
     switch (level) {
       case 'debug':
         if (__DEV__) {
           console.debug(logMessage, logData);
         }
         break;
       case 'info':
         console.info(logMessage, logData);
         break;
       case 'warn':
         console.warn(logMessage, logData);
         // Add to Crashlytics as non-fatal
         crashlytics().log(`WARN: ${message}`);
         break;
       case 'error':
         console.error(logMessage, logData);
         // Log to Crashlytics
         crashlytics().log(`ERROR: ${message}`);
         // Add custom keys for context
         Object.entries(metadata).forEach(([key, value]) => {
           if (typeof value === 'string') {
             crashlytics().setAttribute(key, value);
           } else {
             crashlytics().setAttribute(key, JSON.stringify(value));
           }
         });
         break;
     }
   };
   
   // Convenience methods
   const debug = (message: string, options?: LogOptions): void => log('debug', message, options);
   const info = (message: string, options?: LogOptions): void => log('info', message, options);
   const warn = (message: string, options?: LogOptions): void => log('warn', message, options);
   const error = (message: string, error?: Error, options?: LogOptions): void => {
     log('error', message, {
       ...options,
       metadata: {
         ...(options?.metadata || {}),
         errorMessage: error?.message,
         stack: error?.stack,
       },
     });
     
     // Record as non-fatal error
     if (error) {
       crashlytics().recordError(error);
     }
   };
   
   export const logger = {
     debug,
     info,
     warn,
     error,
   };
   ```

2. **Usage in Components**:
   ```typescript
   // In components/screens
   import { logger } from '../utils/logger';
   
   const CameraScreen: React.FC = () => {
     const { user } = useAuth();
     
     useEffect(() => {
       logger.info('Camera screen mounted', {
         userId: user?.id,
         tags: ['camera', 'ui'],
       });
       
       return () => {
         logger.info('Camera screen unmounted', {
           userId: user?.id,
           tags: ['camera', 'ui'],
         });
       };
     }, [user]);
     
     const handleCapture = async () => {
       try {
         logger.info('Starting image capture', {
           userId: user?.id,
           tags: ['camera', 'capture'],
         });
         
         // Capture logic...
         
         logger.info('Image capture successful', {
           userId: user?.id,
           tags: ['camera', 'capture'],
           metadata: {
             imageSize: /* image size details */,
             deviceInfo: /* device info */,
           },
         });
       } catch (error) {
         logger.error('Image capture failed', error, {
           userId: user?.id,
           tags: ['camera', 'capture', 'error'],
           metadata: {
             deviceInfo: /* device info */,
           },
         });
         
         // Error handling...
       }
     };
     
     // Rest of component...
   };
   ```

## Testing Framework

### Unit Testing

1. **Set Up Testing Environment**:
   ```typescript
   // jest.config.js
   module.exports = {
     preset: 'react-native',
     moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
     setupFiles: ['./jest.setup.js'],
     transformIgnorePatterns: [
       'node_modules/(?!(react-native|@react-native|react-native-vector-icons|@react-navigation)/)',
     ],
     collectCoverage: true,
     collectCoverageFrom: [
       'src/**/*.{ts,tsx}',
       '!src/**/*.d.ts',
       '!src/**/*.test.{ts,tsx}',
       '!src/types/**/*',
       '!src/constants/**/*',
     ],
     coverageThreshold: {
       global: {
         statements: 70,
         branches: 60,
         functions: 70,
         lines: 70,
       },
     },
   };
   
   // jest.setup.js
   import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
   import 'react-native-gesture-handler/jestSetup';
   
   // Mock modules
   jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
   
   // Mock Firebase
   jest.mock('@react-native-firebase/app', () => ({
     // Firebase mock implementation
   }));
   
   // Mock camera
   jest.mock('react-native-vision-camera', () => ({
     // Camera mock implementation
   }));
   ```

2. **Firebase Service Tests**:
   ```typescript
   // firebaseService.test.ts
   import { firebaseService } from '../services/firebaseService';
   import { mockFirestore } from '../__mocks__/firebaseMock';
   
   // Mock Firestore implementation
   jest.mock('@react-native-firebase/firestore', () => mockFirestore);
   
   describe('Firebase Service', () => {
     beforeEach(() => {
       // Reset mocks before each test
       mockFirestore().reset();
     });
     
     describe('getUserById', () => {
       it('should return user data when user exists', async () => {
         // Arrange
         const mockUser = {
           id: 'user123',
           username: 'testuser',
           email: 'test@stanford.edu',
           flakeStreak: 0,
         };
         
         mockFirestore().collection('users').doc('user123').get.mockResolvedValue({
           exists: true,
           data: () => mockUser,
         });
         
         // Act
         const result = await firebaseService.getUserById('user123');
         
         // Assert
         expect(result).toEqual(mockUser);
         expect(mockFirestore().collection).toHaveBeenCalledWith('users');
         expect(mockFirestore().collection().doc).toHaveBeenCalledWith('user123');
       });
       
       it('should return null when user does not exist', async () => {
         // Arrange
         mockFirestore().collection('users').doc('nonexistent').get.mockResolvedValue({
           exists: false,
           data: () => null,
         });
         
         // Act
         const result = await firebaseService.getUserById('nonexistent');
         
         // Assert
         expect(result).toBeNull();
       });
       
       it('should throw error when Firestore fails', async () => {
         // Arrange
         const error = new Error('Firestore error');
         mockFirestore().collection('users').doc('error').get.mockRejectedValue(error);
         
         // Act & Assert
         await expect(firebaseService.getUserById('error')).rejects.toThrow('Firestore error');
       });
     });
     
     // Additional tests for other firebaseService methods...
   });
   ```

3. **Component Tests**:
   ```typescript
   // PairingCard.test.tsx
   import React from 'react';
   import { render, fireEvent, waitFor } from '@testing-library/react-native';
   import PairingCard from '../components/PairingCard';
   import { PairingContext } from '../contexts/PairingContext';
   import { AuthContext } from '../contexts/AuthContext';
   
   // Mock context values
   const mockPairingContext = {
     toggleLikePairing: jest.fn(),
     addCommentToPairing: jest.fn(),
     // Other context values...
   };
   
   const mockAuthContext = {
     user: {
       id: 'currentUser',
       username: 'testuser',
     },
     // Other context values...
   };
   
   // Sample pairing data
   const mockPairing = {
     id: 'pairing123',
     users: ['currentUser', 'partner123'],
     status: 'completed',
     selfieURL: 'https://example.com/selfie.jpg',
     likes: 5,
     likedBy: ['user1', 'user2'],
     comments: [
       {
         id: 'comment1',
         userId: 'user1',
         username: 'commenter',
         text: 'Great selfie!',
         createdAt: { toDate: () => new Date() },
       },
     ],
     date: { toDate: () => new Date() },
     isPrivate: false,
   };
   
   describe('PairingCard', () => {
     beforeEach(() => {
       jest.clearAllMocks();
     });
     
     it('renders pairing information correctly', () => {
       // Arrange & Act
       const { getByText, getByTestId } = render(
         <AuthContext.Provider value={mockAuthContext as any}>
           <PairingContext.Provider value={mockPairingContext as any}>
             <PairingCard pairing={mockPairing as any} />
           </PairingContext.Provider>
         </AuthContext.Provider>
       );
       
       // Assert
       expect(getByTestId('selfie-image')).toBeTruthy();
       expect(getByText('5')).toBeTruthy(); // Likes count
       expect(getByText('Great selfie!')).toBeTruthy(); // Comment text
     });
     
     it('calls toggleLikePairing when like button is pressed', async () => {
       // Arrange
       const { getByTestId } = render(
         <AuthContext.Provider value={mockAuthContext as any}>
           <PairingContext.Provider value={mockPairingContext as any}>
             <PairingCard pairing={mockPairing as any} />
           </PairingContext.Provider>
         </AuthContext.Provider>
       );
       
       // Act
       fireEvent.press(getByTestId('like-button'));
       
       // Assert
       await waitFor(() => {
         expect(mockPairingContext.toggleLikePairing).toHaveBeenCalledWith('pairing123');
       });
     });
     
     it('adds comment when comment form is submitted', async () => {
       // Arrange
       const { getByTestId, getByPlaceholderText } = render(
         <AuthContext.Provider value={mockAuthContext as any}>
           <PairingContext.Provider value={mockPairingContext as any}>
             <PairingCard pairing={mockPairing as any} />
           </PairingContext.Provider>
         </AuthContext.Provider>
       );
       
       // Act - enter comment text and submit
       fireEvent.changeText(getByPlaceholderText('Add a comment...'), 'New comment');
       fireEvent.press(getByTestId('submit-comment-button'));
       
       // Assert
       await waitFor(() => {
         expect(mockPairingContext.addCommentToPairing).toHaveBeenCalledWith(
           'pairing123', 
           'New comment'
         );
       });
     });
     
     // Additional tests...
   });
   ```

### End-to-End Testing

1. **Configure Detox**:
   ```javascript
   // e2e/config.json
   {
     "testRunner": "jest",
     "runnerConfig": "e2e/jest.config.js",
     "apps": {
       "ios.release": {
         "type": "ios.app",
         "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/DailyMeetupSelfie.app",
         "build": "xcodebuild -workspace ios/DailyMeetupSelfie.xcworkspace -scheme DailyMeetupSelfie -configuration Release -sdk iphonesimulator -derivedDataPath ios/build"
       },
       "android.release": {
         "type": "android.apk",
         "binaryPath": "android/app/build/outputs/apk/release/app-release.apk",
         "build": "cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd .."
       }
     },
     "devices": {
       "simulator": {
         "type": "ios.simulator",
         "device": {
           "type": "iPhone 13"
         }
       },
       "emulator": {
         "type": "android.emulator",
         "device": {
           "avdName": "Pixel_3a_API_29"
         }
       }
     },
     "configurations": {
       "ios.release": {
         "device": "simulator",
         "app": "ios.release"
       },
       "android.release": {
         "device": "emulator",
         "app": "android.release"
       }
     }
   }
   ```

2. **Authentication Flow Test**:
   ```typescript
   // e2e/auth.test.js
   describe('Authentication Flow', () => {
     beforeAll(async () => {
       await device.launchApp();
     });
     
     beforeEach(async () => {
       await device.reloadReactNative();
     });
     
     it('should navigate through onboarding after successful login', async () => {
       // Wait for auth screen to be visible
       await waitFor(element(by.text('Sign in to continue')))
         .toBeVisible()
         .withTimeout(2000);
       
       // Enter credentials
       await element(by.id('email-input')).typeText('test@stanford.edu');
       await element(by.id('password-input')).typeText('password123');
       
       // Hide keyboard and sign in
       await element(by.id('password-input')).tapReturnKey();
       await element(by.id('sign-in-button')).tap();
       
       // Verify onboarding first screen appears
       await waitFor(element(by.text('Welcome to Daily Meetup Selfie')))
         .toBeVisible()
         .withTimeout(5000);
       
       // Navigate through onboarding
       await element(by.id('onboarding-next-button')).tap();
       
       // Verify permissions screen
       await waitFor(element(by.text('Camera Access')))
         .toBeVisible()
         .withTimeout(2000);
       
       // Continue through each onboarding step
       await element(by.id('onboarding-next-button')).tap();
       
       // Enter username
       await waitFor(element(by.id('username-input')))
         .toBeVisible()
         .withTimeout(2000);
       
       await element(by.id('username-input')).typeText('testuser123');
       await element(by.id('username-input')).tapReturnKey();
       await element(by.id('onboarding-next-button')).tap();
       
       // Skip profile photo
       await waitFor(element(by.id('skip-photo-button')))
         .toBeVisible()
         .withTimeout(2000);
       
       await element(by.id('skip-photo-button')).tap();
       
       // Complete onboarding
       await waitFor(element(by.text('All Set!')))
         .toBeVisible()
         .withTimeout(2000);
       
       await element(by.id('get-started-button')).tap();
       
       // Verify main feed is shown
       await waitFor(element(by.id('feed-screen')))
         .toBeVisible()
         .withTimeout(5000);
     });
   });
   ```

3. **Camera Capture Test**:
   ```typescript
   // e2e/camera.test.js
   describe('Camera Capture Flow', () => {
     beforeAll(async () => {
       // Launch app and log in
       await device.launchApp();
       // Login helper function
       await loginAsTestUser();
     });
     
     beforeEach(async () => {
       await device.reloadReactNative();
     });
     
     it('should navigate to camera and complete capture flow', async () => {
       // Verify main feed is shown
       await waitFor(element(by.id('feed-screen')))
         .toBeVisible()
         .withTimeout(5000);
       
       // Navigate to camera
       await element(by.id('camera-tab-button')).tap();
       
       // Verify camera screen is visible
       await waitFor(element(by.id('camera-screen')))
         .toBeVisible()
         .withTimeout(2000);
       
       // Mock camera permissions
       await device.setPermissions({ camera: 'YES' });
       
       // Wait for camera to initialize
       await waitFor(element(by.id('camera-capture-button')))
         .toBeVisible()
         .withTimeout(5000);
       
       // Take photo
       await element(by.id('camera-capture-button')).tap();
       
       // Wait for preview screen
       await waitFor(element(by.id('preview-screen')))
         .toBeVisible()
         .withTimeout(3000);
       
       // Confirm photo
       await element(by.id('confirm-photo-button')).tap();
       
       // Wait for upload completion
       await waitFor(element(by.text('Selfie Posted!')))
         .toBeVisible()
         .withTimeout(10000);
       
       // Navigate back to feed
       await element(by.text('View in Feed')).tap();
       
       // Verify back on feed screen with new post
       await waitFor(element(by.id('feed-screen')))
         .toBeVisible()
         .withTimeout(3000);
       
       // Verify new post appears
       await waitFor(element(by.id('pairing-card')).atIndex(0))
         .toBeVisible()
         .withTimeout(3000);
     });
   });
   ```

## Release Preparation

### App Configuration

1. **Configure App Environments**:
   ```typescript
   // config/environments.ts
   type Environment = 'development' | 'staging' | 'production';
   
   interface EnvironmentConfig {
     apiUrl: string;
     firebaseConfig: {
       apiKey: string;
       authDomain: string;
       projectId: string;
       storageBucket: string;
       messagingSenderId: string;
       appId: string;
       measurementId?: string;
     };
     loggingEnabled: boolean;
     crashReportingEnabled: boolean;
     analyticsEnabled: boolean;
   }
   
   const configs: Record<Environment, EnvironmentConfig> = {
     development: {
       apiUrl: 'https://dev-api.dailymeetup.example.com',
       firebaseConfig: {
         // Development Firebase config
       },
       loggingEnabled: true,
       crashReportingEnabled: false,
       analyticsEnabled: false,
     },
     staging: {
       apiUrl: 'https://staging-api.dailymeetup.example.com',
       firebaseConfig: {
         // Staging Firebase config
       },
       loggingEnabled: true,
       crashReportingEnabled: true,
       analyticsEnabled: true,
     },
     production: {
       apiUrl: 'https://api.dailymeetup.example.com',
       firebaseConfig: {
         // Production Firebase config
       },
       loggingEnabled: false,
       crashReportingEnabled: true,
       analyticsEnabled: true,
     },
   };
   
   // Get current environment based on build config
   const getEnvironment = (): Environment => {
     // For Expo, use Constants.manifest.releaseChannel
     // For bare React Native, can use custom env variables or build configurations
     if (__DEV__) {
       return 'development';
     }
     
     // Check for staging/production based on bundle ID or other indicators
     return 'production';
   };
   
   export const getCurrentConfig = (): EnvironmentConfig => {
     const env = getEnvironment();
     return configs[env];
   };
   ```

2. **Version Management**:
   ```typescript
   // utils/version.ts
   import { Platform } from 'react-native';
   import DeviceInfo from 'react-native-device-info';
   
   export const getAppVersion = (): string => {
     return DeviceInfo.getVersion();
   };
   
   export const getBuildNumber = (): string => {
     return DeviceInfo.getBuildNumber();
   };
   
   export const getFullVersionString = (): string => {
     return `${getAppVersion()} (${getBuildNumber()})`;
   };
   
   export const getDeviceInfo = (): Record<string, string> => {
     return {
       appVersion: getAppVersion(),
       buildNumber: getBuildNumber(),
       deviceType: Platform.OS,
       deviceModel: DeviceInfo.getModel(),
       systemVersion: DeviceInfo.getSystemVersion(),
       deviceId: DeviceInfo.getDeviceId(),
     };
   };
   ```

### App Store Assets

1. **Generate App Icons**:
   ```bash
   # For iOS
   npx @bam.tech/react-native-make generate-bootsplash assets/app-icon.png \
     --background-color="#FFFFFF" \
     --logo-width=100 \
     --assets-path=assets
   
   # For Android
   npx @bam.tech/react-native-make set-icon --path assets/app-icon.png
   ```

2. **Create Privacy Policy**:
   ```markdown
   # Privacy Policy

   ## Introduction
   
   This Privacy Policy describes how Daily Meetup Selfie ("we," "our," or "us") collects, uses, and shares information about you when you use our mobile application ("App").
   
   ## Information We Collect
   
   ### Information You Provide
   
   - **Account Information**: When you register for an account, we collect your email address, username, and password.
   - **Profile Information**: You may choose to provide a display name and profile photo.
   - **Content**: We collect the photos you take with the App, including selfies and other images.
   - **Communications**: We collect information when you communicate with other users through the App.
   
   ### Information Collected Automatically
   
   - **Usage Information**: We collect information about your activity on the App, such as when you open the App, features you use, and how you interact with content.
   - **Device Information**: We collect information about the device you use to access the App, including device type, operating system, and unique device identifiers.
   
   ## How We Use Your Information
   
   We use the information we collect to:
   
   - Provide, maintain, and improve the App
   - Create and maintain your account
   - Facilitate the daily pairing feature
   - Send notifications about new pairings, comments, and other activity
   - Monitor and analyze usage patterns
   - Detect and prevent fraud and abuse
   
   ## Data Retention
   
   Selfie images are automatically deleted after 30 days. You can manually delete your content at any time.
   
   ## Your Rights
   
   You can access, correct, or delete your personal information by accessing your account settings or contacting us.
   
   ## Changes to This Privacy Policy
   
   We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
   
   ## Contact Us
   
   If you have any questions about this Privacy Policy, please contact us at privacy@dailymeetup.example.com.
   
   Last Updated: April 30, 2025
   ```

3. **App Store Screenshots**:
   - Create screenshot templates for various devices
   - Include captions highlighting key features
   - Design a feature image showcasing the app's core functionality

## Implementation Tasks

1. **Performance Optimization**:
   - Optimize Firebase queries for feed and pairing data
   - Implement image resizing and caching
   - Memoize React components and callbacks
   - Optimize FlatList configurations
   - Implement progressive image loading

2. **Error Monitoring**:
   - Configure Firebase Crashlytics integration
   - Implement custom error boundaries
   - Create global error handlers
   - Develop comprehensive logging service
   - Add contextual error reporting

3. **Testing Framework**:
   - Set up Jest for unit testing
   - Create Firebase service mocks and tests
   - Implement component unit tests
   - Configure Detox for end-to-end testing
   - Write critical flow test cases

4. **Release Preparation**:
   - Configure environment-specific settings
   - Create version management utilities
   - Generate app icons and splash screens
   - Prepare App Store assets (screenshots, descriptions)
   - Write privacy policy and terms of service

## Testing Strategy

1. **Unit Tests**:
   - Test all Firebase service methods
   - Validate utility functions
   - Test context providers
   - Verify component rendering and interactions

2. **Integration Tests**:
   - Test component interactions
   - Verify Firebase service integration
   - Test navigation flows
   - Validate form submissions

3. **End-to-End Tests**:
   - Test authentication flow
   - Verify onboarding process
   - Test camera capture functionality
   - Validate feed loading and interactions
   - Test notification handling

4. **Performance Testing**:
   - Measure and optimize feed loading times
   - Test image loading and compression
   - Evaluate memory usage during navigation
   - Benchmark Firebase query performance

## Expected Outcomes

After completing Phase 4, we will have:

1. A highly optimized application with efficient data queries and rendering
2. Comprehensive error monitoring and logging for production debugging
3. A robust testing framework covering unit, integration, and end-to-end tests
4. Complete release preparation for App Store and Google Play submission
5. A stable, reliable application ready for user adoption

These enhancements will ensure the Daily Meetup Selfie app provides a smooth, reliable experience for users while giving the development team the tools needed to monitor, maintain, and improve the application over time.