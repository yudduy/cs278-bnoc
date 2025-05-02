import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useFonts, Chivo_400Regular, Chivo_700Bold } from '@expo-google-fonts/chivo';
import { COLORS } from '../config/theme';

interface AppFontsProps {
  children: React.ReactNode;
}

export default function AppFonts({ children }: AppFontsProps) {
  const [fontsLoaded] = useFonts({
    ChivoRegular: Chivo_400Regular,
    ChivoBold: Chivo_700Bold,
  });
  
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <>{children}</>;
}