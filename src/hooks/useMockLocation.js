import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * Mock location configuration
 */
const MOCK_CONFIG = {
  // Starting location (default: San Francisco)
  defaultLocation: {
    latitude: 37.7749,
    longitude: -122.4194,
  },
  // Movement settings
  walkingSpeedMps: 1.4, // meters per second (average walking speed)
  updateIntervalMs: 1000, // update every second
  // Random variation
  directionChangeChance: 0.1, // 10% chance to change direction each update
  speedVariation: 0.3, // +/- 30% speed variation
  // Simulate network speed variation based on location
  networkSpeedBase: 35, // Base speed in Mbps
  networkSpeedVariation: 40, // Random variation range
  // Areas with poor signal (for realistic simulation)
  poorSignalZones: [
    { lat: 37.7760, lng: -122.4180, radius: 0.001, speedFactor: 0.2 },
    { lat: 37.7735, lng: -122.4210, radius: 0.0015, speedFactor: 0.1 },
  ],
};

/**
 * Calculate distance between two points in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert meters to degrees (approximate)
 */
const metersToDegreesLat = (meters) => meters / 111320;
const metersToDegreesLng = (meters, latitude) => 
  meters / (111320 * Math.cos((latitude * Math.PI) / 180));

/**
 * Generate simulated network speed based on location
 */
const getSimulatedNetworkSpeed = (latitude, longitude) => {
  let speedFactor = 1;
  
  // Check if in a poor signal zone
  for (const zone of MOCK_CONFIG.poorSignalZones) {
    const distance = calculateDistance(latitude, longitude, zone.lat, zone.lng);
    const zoneRadiusMeters = zone.radius * 111320;
    if (distance < zoneRadiusMeters) {
      speedFactor = Math.min(speedFactor, zone.speedFactor);
    }
  }
  
  // Calculate speed with variation
  const baseSpeed = MOCK_CONFIG.networkSpeedBase * speedFactor;
  const variation = (Math.random() - 0.5) * MOCK_CONFIG.networkSpeedVariation * speedFactor;
  
  return Math.max(0.5, baseSpeed + variation);
};

/**
 * Custom hook for mocking location on web platform
 * Simulates walking movement with realistic speed and direction changes
 */
export const useMockLocation = (options = {}) => {
  const {
    enabled = false,
    startLocation = MOCK_CONFIG.defaultLocation,
    onLocationUpdate,
    onSpeedUpdate,
    updateInterval = MOCK_CONFIG.updateIntervalMs,
  } = options;

  const [location, setLocation] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedSpeed, setSimulatedSpeed] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [pathHistory, setPathHistory] = useState([]);
  
  // Current movement direction (in radians)
  const directionRef = useRef(Math.random() * 2 * Math.PI);
  const intervalRef = useRef(null);
  const lastLocationRef = useRef(null);

  // Generate initial location
  const initializeLocation = useCallback(() => {
    const initialLocation = {
      coords: {
        latitude: startLocation.latitude,
        longitude: startLocation.longitude,
        altitude: 10,
        accuracy: 5,
        altitudeAccuracy: 5,
        heading: (directionRef.current * 180) / Math.PI,
        speed: MOCK_CONFIG.walkingSpeedMps,
      },
      timestamp: Date.now(),
      mocked: true,
    };
    
    setLocation(initialLocation);
    lastLocationRef.current = initialLocation;
    setPathHistory([{
      latitude: startLocation.latitude,
      longitude: startLocation.longitude,
    }]);
    
    // Get initial network speed
    const networkSpeed = getSimulatedNetworkSpeed(
      startLocation.latitude,
      startLocation.longitude
    );
    setSimulatedSpeed(networkSpeed);
    
    if (onLocationUpdate) {
      onLocationUpdate(initialLocation);
    }
    if (onSpeedUpdate) {
      onSpeedUpdate(networkSpeed);
    }
    
    return initialLocation;
  }, [startLocation, onLocationUpdate, onSpeedUpdate]);

  // Simulate one step of movement
  const simulateStep = useCallback(() => {
    if (!lastLocationRef.current) return;
    
    const { latitude, longitude } = lastLocationRef.current.coords;
    
    // Randomly change direction
    if (Math.random() < MOCK_CONFIG.directionChangeChance) {
      // Smooth direction change (max 45 degrees)
      const directionChange = (Math.random() - 0.5) * Math.PI / 2;
      directionRef.current += directionChange;
    }
    
    // Calculate movement with speed variation
    const speedVariation = 1 + (Math.random() - 0.5) * MOCK_CONFIG.speedVariation * 2;
    const actualSpeed = MOCK_CONFIG.walkingSpeedMps * speedVariation;
    const distanceMeters = actualSpeed * (updateInterval / 1000);
    
    // Calculate new position
    const deltaLat = metersToDegreesLat(distanceMeters * Math.cos(directionRef.current));
    const deltaLng = metersToDegreesLng(
      distanceMeters * Math.sin(directionRef.current),
      latitude
    );
    
    const newLatitude = latitude + deltaLat;
    const newLongitude = longitude + deltaLng;
    
    // Create new location object
    const newLocation = {
      coords: {
        latitude: newLatitude,
        longitude: newLongitude,
        altitude: 10 + (Math.random() - 0.5) * 2,
        accuracy: 3 + Math.random() * 4,
        altitudeAccuracy: 5,
        heading: (directionRef.current * 180) / Math.PI,
        speed: actualSpeed,
      },
      timestamp: Date.now(),
      mocked: true,
    };
    
    // Update state
    setLocation(newLocation);
    lastLocationRef.current = newLocation;
    setTotalDistance(prev => prev + distanceMeters);
    setPathHistory(prev => [...prev, {
      latitude: newLatitude,
      longitude: newLongitude,
    }]);
    
    // Get network speed for new location
    const networkSpeed = getSimulatedNetworkSpeed(newLatitude, newLongitude);
    setSimulatedSpeed(networkSpeed);
    
    // Callbacks
    if (onLocationUpdate) {
      onLocationUpdate(newLocation);
    }
    if (onSpeedUpdate) {
      onSpeedUpdate(networkSpeed);
    }
  }, [updateInterval, onLocationUpdate, onSpeedUpdate]);

  // Start simulation
  const startSimulation = useCallback(() => {
    if (Platform.OS !== 'web') {
      console.warn('Mock location is only available on web platform');
      return;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Initialize if no location
    if (!lastLocationRef.current) {
      initializeLocation();
    }
    
    // Start movement simulation
    intervalRef.current = setInterval(simulateStep, updateInterval);
    setIsSimulating(true);
    
    console.log('🚶 Mock location simulation started');
  }, [initializeLocation, simulateStep, updateInterval]);

  // Stop simulation
  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSimulating(false);
    console.log('🛑 Mock location simulation stopped');
  }, []);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    stopSimulation();
    setTotalDistance(0);
    setPathHistory([]);
    directionRef.current = Math.random() * 2 * Math.PI;
    lastLocationRef.current = null;
    initializeLocation();
  }, [stopSimulation, initializeLocation]);

  // Set custom starting location
  const setStartLocation = useCallback((lat, lng) => {
    stopSimulation();
    const newStart = { latitude: lat, longitude: lng };
    lastLocationRef.current = null;
    setPathHistory([]);
    setTotalDistance(0);
    
    const initialLocation = {
      coords: {
        latitude: lat,
        longitude: lng,
        altitude: 10,
        accuracy: 5,
        altitudeAccuracy: 5,
        heading: (directionRef.current * 180) / Math.PI,
        speed: 0,
      },
      timestamp: Date.now(),
      mocked: true,
    };
    
    setLocation(initialLocation);
    lastLocationRef.current = initialLocation;
    setPathHistory([{ latitude: lat, longitude: lng }]);
    
    if (onLocationUpdate) {
      onLocationUpdate(initialLocation);
    }
  }, [stopSimulation, onLocationUpdate]);

  // Auto-start if enabled
  useEffect(() => {
    if (enabled && Platform.OS === 'web') {
      initializeLocation();
      startSimulation();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    location,
    isSimulating,
    simulatedSpeed,
    totalDistance,
    pathHistory,
    startSimulation,
    stopSimulation,
    resetSimulation,
    setStartLocation,
    isWebPlatform: Platform.OS === 'web',
  };
};

export default useMockLocation;
