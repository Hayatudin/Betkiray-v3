// hooks/useWarmUpBrowser.ts

import React from 'react';
import { Platform } from 'react-native'; // <-- 1. Import Platform
import * as WebBrowser from 'expo-web-browser';

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // 2. Add a check to only run this code on mobile
    if (Platform.OS !== 'web') {
      WebBrowser.warmUpAsync();
      return () => {
        WebBrowser.coolDownAsync();
      };
    }
  }, []);
};