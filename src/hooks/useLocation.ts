import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import type { LocationSubscription } from 'expo-location';
import type {
  UseLocationOptions,
  UseLocationReturn,
  AppLocationObject,
} from '../types';

/**
 * Custom hook for handling location tracking
 */
export const useLocation = (options: UseLocationOptions = {}): UseLocationReturn => {
  const {
    timeInterval = 1000,
    distanceInterval = 2,
    onLocationUpdate,
  } = options;

  const [location, setLocation] = useState<AppLocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  const subscriptionRef = useRef<LocationSubscription | null>(null);

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        setError('Location permission denied');
        setHasPermission(false);
        return false;
      }

      // Try background permission for continuous tracking
      if (Platform.OS !== 'web') {
        try {
          await Location.requestBackgroundPermissionsAsync();
        } catch (e) {
          console.log('Background permission not available:', e);
        }
      }

      setHasPermission(true);
      setError(null);
      return true;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError('Error requesting permission: ' + errorMessage);
      setHasPermission(false);
      return false;
    }
  }, []);

  // Get current location once
  const getCurrentLocation = useCallback(async (): Promise<AppLocationObject | null> => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      return currentLocation;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError('Error getting location: ' + errorMessage);
      return null;
    }
  }, []);

  // Start tracking
  const startTracking = useCallback(async (): Promise<boolean> => {
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) return false;
    }

    try {
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval,
          distanceInterval,
        },
        (newLocation) => {
          setLocation(newLocation);
          if (onLocationUpdate) {
            onLocationUpdate(newLocation);
          }
        }
      );
      setIsTracking(true);
      return true;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError('Error starting tracking: ' + errorMessage);
      return false;
    }
  }, [hasPermission, timeInterval, distanceInterval, onLocationUpdate, requestPermissions]);

  // Stop tracking
  const stopTracking = useCallback((): void => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Initialize permissions on mount
  useEffect(() => {
    requestPermissions().then((granted) => {
      if (granted) {
        getCurrentLocation();
      }
    });

    return () => {
      stopTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    location,
    error,
    isTracking,
    hasPermission,
    requestPermissions,
    getCurrentLocation,
    startTracking,
    stopTracking,
  };
};

export default useLocation;
