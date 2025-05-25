const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Firebase v11 compatibility with Expo SDK 53
// Based on: https://github.com/expo/expo/issues/36588
config.resolver.unstable_enablePackageExports = false;

module.exports = config; 