import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * Custom hook for handling location tracking
 * @param {Object} options - Configuration options
 * @param {number} options.timeInterval - Time interval between updates (ms)
 * @param {number} options.distanceInterval - Distance interval between updates (meters)
 * @param {Function} options.onLocationUpdate - Callback when location updates
 */
export const useLocation = (options = {}) => {
  const {
    timeInterval = 1000,
    distanceInterval = 2,
    onLocationUpdate,
  } = options;

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  const subscriptionRef = useRef(null);

  // Request permissions
  const requestPermissions = useCallback(async () => {
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
      setError('Error requesting permission: ' + e.message);
      setHasPermission(false);
      return false;
    }
  }, []);

  // Get current location once
  const getCurrentLocation = useCallback(async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      return currentLocation;
    } catch (e) {
      setError('Error getting location: ' + e.message);
      return null;
    }
  }, []);

  // Start tracking
  const startTracking = useCallback(async () => {
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
      setError('Error starting tracking: ' + e.message);
      return false;
    }
  }, [hasPermission, timeInterval, distanceInterval, onLocationUpdate, requestPermissions]);

  // Stop tracking
  const stopTracking = useCallback(() => {
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
