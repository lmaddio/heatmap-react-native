import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import './src/global.css';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// Platform-specific map components (uses .web.tsx or .native.tsx automatically)
import { MapView, Circle, Polyline, Marker } from './src/components/MapComponents';
import DemoModePanel from './src/components/DemoModePanel';

import { 
  getSpeedColor, 
  getSpeedLabel, 
  getHeatmapGradient,
  SPEED_THRESHOLDS 
} from './src/utils/heatmapUtils';

import type {
  DataPoint,
  Coordinates,
  AppLocationObject,
  MockedLocationObject,
  NetworkZone,
  MapViewRef,
  HeatmapGradient,
  NetworkType,
} from './src/types';

// Check if running in demo/test mode on web
const IS_WEB = Platform.OS === 'web';
const DEMO_MODE_AVAILABLE = IS_WEB;

const { width, height } = Dimensions.get('window');

// Multiple test endpoints to avoid 429/409 rate limiting
const TEST_ENDPOINTS: string[] = [
  'https://www.google.com/generate_204',
  'https://www.gstatic.com/generate_204',
  'https://connectivitycheck.gstatic.com/generate_204',
  'https://www.apple.com/library/test/success.html',
  'https://captive.apple.com/hotspot-detect.html',
  'https://www.msftconnecttest.com/connecttest.txt',
  'https://cloudflare.com/cdn-cgi/trace',
  'https://1.1.1.1/cdn-cgi/trace',
];

let currentEndpointIndex = 0;

// Get next test endpoint (round-robin)
const getNextEndpoint = (): string => {
  const endpoint = TEST_ENDPOINTS[currentEndpointIndex];
  currentEndpointIndex = (currentEndpointIndex + 1) % TEST_ENDPOINTS.length;
  return endpoint;
};

// Estimate network speed based on connection type and details
const estimateNetworkSpeed = async (netInfoState: NetInfoState): Promise<number> => {
  if (!netInfoState.isConnected) {
    return 0;
  }

  const { type, details } = netInfoState;
  let baseSpeed = 0;
  
  switch (type) {
    case 'wifi':
      baseSpeed = 50;
      if (details && 'strength' in details && typeof details.strength === 'number') {
        baseSpeed = (details.strength / 100) * 100;
      }
      break;
    case 'cellular':
      if (details && 'cellularGeneration' in details && details.cellularGeneration) {
        switch (details.cellularGeneration) {
          case '5g':
            baseSpeed = 100;
            break;
          case '4g':
            baseSpeed = 35;
            break;
          case '3g':
            baseSpeed = 5;
            break;
          case '2g':
            baseSpeed = 0.5;
            break;
          default:
            baseSpeed = 10;
        }
      } else {
        baseSpeed = 10;
      }
      break;
    case 'ethernet':
      baseSpeed = 100;
      break;
    case 'bluetooth':
      baseSpeed = 2;
      break;
    default:
      baseSpeed = 5;
  }

  const variation = (Math.random() * 0.4 - 0.2) * baseSpeed;
  return Math.max(0, baseSpeed + variation);
};

// Perform actual speed test using rotating endpoints
const performSpeedTest = async (): Promise<number | null> => {
  const endpoint = getNextEndpoint();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const startTime = Date.now();
    await fetch(endpoint, {
      method: 'GET',
      cache: 'no-cache',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    const latency = Date.now() - startTime;
    
    // Map latency to approximate speed
    if (latency < 30) return 100;
    if (latency < 50) return 80;
    if (latency < 80) return 60;
    if (latency < 120) return 45;
    if (latency < 200) return 30;
    if (latency < 350) return 20;
    if (latency < 500) return 12;
    if (latency < 800) return 7;
    if (latency < 1200) return 4;
    return 1;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`Speed test failed for ${endpoint}:`, errorMessage);
    return null;
  }
};

// Demo mode configuration
interface DemoConfig {
  startLocation: Coordinates;
  walkingSpeedMps: number;
  updateIntervalMs: number;
  directionChangeChance: number;
  networkZones: NetworkZone[];
}

const DEMO_CONFIG: DemoConfig = {
  startLocation: { latitude: 37.7749, longitude: -122.4194 },
  walkingSpeedMps: 1.4,
  updateIntervalMs: 1000,
  directionChangeChance: 0.15,
  
  // Network zones with different signal qualities
  networkZones: [
    // Dead zones (no signal) - tunnels, basements
    { lat: 37.7760, lng: -122.4180, radius: 0.0008, type: 'dead', baseSpeed: 0 },
    { lat: 37.7730, lng: -122.4220, radius: 0.0006, type: 'dead', baseSpeed: 0 },
    
    // Poor signal zones - buildings blocking signal
    { lat: 37.7755, lng: -122.4175, radius: 0.0015, type: 'poor', baseSpeed: 3 },
    { lat: 37.7740, lng: -122.4210, radius: 0.0018, type: 'poor', baseSpeed: 5 },
    { lat: 37.7765, lng: -122.4200, radius: 0.0012, type: 'poor', baseSpeed: 4 },
    { lat: 37.7735, lng: -122.4185, radius: 0.001, type: 'poor', baseSpeed: 6 },
    
    // Fair signal zones - moderate coverage
    { lat: 37.7752, lng: -122.4190, radius: 0.002, type: 'fair', baseSpeed: 15 },
    { lat: 37.7745, lng: -122.4205, radius: 0.0015, type: 'fair', baseSpeed: 18 },
    { lat: 37.7758, lng: -122.4215, radius: 0.0012, type: 'fair', baseSpeed: 12 },
    
    // Good signal zones - near cell towers
    { lat: 37.7748, lng: -122.4195, radius: 0.002, type: 'good', baseSpeed: 40 },
    { lat: 37.7742, lng: -122.4180, radius: 0.0018, type: 'good', baseSpeed: 45 },
    
    // Excellent signal zones - 5G hotspots
    { lat: 37.7750, lng: -122.4188, radius: 0.001, type: 'excellent', baseSpeed: 85 },
    { lat: 37.7738, lng: -122.4198, radius: 0.0008, type: 'excellent', baseSpeed: 95 },
  ],
};

export default function App(): React.JSX.Element {
  const [location, setLocation] = useState<AppLocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [networkSpeed, setNetworkSpeed] = useState(0);
  const [networkType, setNetworkType] = useState<NetworkType>('unknown');
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [pathCoordinates, setPathCoordinates] = useState<Coordinates[]>([]);
  const [demoModeEnabled, setDemoModeEnabled] = useState(IS_WEB);

  const mapRef = useRef<MapViewRef | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const netInfoSubscription = useRef<(() => void) | null>(null);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Demo simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);
  const [simulatedSpeed, setSimulatedSpeed] = useState(35);
  const directionRef = useRef(Math.random() * 2 * Math.PI);
  const lastDemoLocationRef = useRef<Coordinates | null>(null);

  // Calculate simulated network speed based on location with realistic variations
  const getSimulatedNetworkSpeed = useCallback((lat: number, lng: number): number => {
    let bestZone: NetworkZone | null = null;
    let minDistance = Infinity;
    
    // Find the closest zone
    for (const zone of DEMO_CONFIG.networkZones) {
      const distance = Math.sqrt(
        Math.pow((lat - zone.lat) * 111320, 2) + 
        Math.pow((lng - zone.lng) * 111320 * Math.cos(lat * Math.PI / 180), 2)
      );
      const zoneRadiusMeters = zone.radius * 111320;
      
      if (distance < zoneRadiusMeters && distance < minDistance) {
        minDistance = distance;
        bestZone = zone;
      }
    }
    
    let baseSpeed: number;
    let variationRange: number;
    
    if (bestZone) {
      // Inside a specific zone
      baseSpeed = bestZone.baseSpeed;
      
      // Variation depends on zone type
      switch (bestZone.type) {
        case 'dead':
          variationRange = 0.5;
          break;
        case 'poor':
          variationRange = 4;
          break;
        case 'fair':
          variationRange = 8;
          break;
        case 'good':
          variationRange = 15;
          break;
        case 'excellent':
          variationRange = 10;
          break;
        default:
          variationRange = 10;
      }
    } else {
      // Default outdoor coverage - mix of conditions
      const noiseX = Math.sin(lat * 10000) * Math.cos(lng * 10000);
      const noiseY = Math.cos(lat * 8000) * Math.sin(lng * 12000);
      const noise = (noiseX + noiseY + 2) / 4;
      
      baseSpeed = 10 + noise * 50;
      variationRange = 15;
    }
    
    // Add random fluctuation
    const fluctuation = (Math.random() - 0.5) * 2 * variationRange;
    
    // Add time-based variation
    const timeVariation = Math.sin(Date.now() / 5000) * 5;
    
    let finalSpeed = baseSpeed + fluctuation + timeVariation;
    finalSpeed = Math.max(0, Math.min(100, finalSpeed));
    
    // Occasional spike or drop
    if (Math.random() < 0.05) {
      finalSpeed = Math.random() < 0.5 
        ? finalSpeed * 0.3
        : Math.min(100, finalSpeed * 1.5);
    }
    
    return Math.round(finalSpeed * 10) / 10;
  }, []);

  // Perform one step of demo simulation
  const demoStep = useCallback((): void => {
    const currentLoc = lastDemoLocationRef.current;
    if (!currentLoc) return;

    // Random direction change
    if (Math.random() < DEMO_CONFIG.directionChangeChance) {
      directionRef.current += (Math.random() - 0.5) * Math.PI / 2;
    }

    // Calculate movement
    const speedVariation = 1 + (Math.random() - 0.5) * 0.4;
    const actualSpeed = DEMO_CONFIG.walkingSpeedMps * speedVariation;
    const distanceMeters = actualSpeed * (DEMO_CONFIG.updateIntervalMs / 1000);

    // Convert to degrees
    const deltaLat = (distanceMeters * Math.cos(directionRef.current)) / 111320;
    const deltaLng = (distanceMeters * Math.sin(directionRef.current)) / 
      (111320 * Math.cos(currentLoc.latitude * Math.PI / 180));

    const newLat = currentLoc.latitude + deltaLat;
    const newLng = currentLoc.longitude + deltaLng;

    // Update location
    const newLocation: MockedLocationObject = {
      coords: {
        latitude: newLat,
        longitude: newLng,
        altitude: 10,
        accuracy: 5,
        heading: (directionRef.current * 180) / Math.PI,
        speed: actualSpeed,
      },
      timestamp: Date.now(),
      mocked: true,
    };

    // Calculate network speed for new location
    const newSpeed = getSimulatedNetworkSpeed(newLat, newLng);
    setSimulatedSpeed(newSpeed);
    setNetworkSpeed(newSpeed);

    // Update state
    setLocation(newLocation);
    lastDemoLocationRef.current = { latitude: newLat, longitude: newLng };
    setTotalDistance(prev => prev + distanceMeters);

    // Add data point
    const gradient = getHeatmapGradient(newSpeed);
    const newPoint: DataPoint = {
      id: Date.now() + Math.random(),
      latitude: newLat,
      longitude: newLng,
      speed: newSpeed,
      timestamp: new Date().toISOString(),
      color: getSpeedColor(newSpeed),
      gradient: gradient,
    };

    setDataPoints(prev => [...prev, newPoint]);
    setPathCoordinates(prev => [...prev, { latitude: newLat, longitude: newLng }]);

    // Center map
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: newLat,
        longitude: newLng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 300);
    }
  }, [getSimulatedNetworkSpeed]);

  // Start demo simulation
  const startDemoSimulation = useCallback((): void => {
    if (!IS_WEB) return;

    // Initialize starting location if needed
    if (!lastDemoLocationRef.current) {
      lastDemoLocationRef.current = {
        latitude: DEMO_CONFIG.startLocation.latitude,
        longitude: DEMO_CONFIG.startLocation.longitude,
      };
      
      const initialLocation: MockedLocationObject = {
        coords: {
          latitude: DEMO_CONFIG.startLocation.latitude,
          longitude: DEMO_CONFIG.startLocation.longitude,
          altitude: 10,
          accuracy: 5,
        },
        timestamp: Date.now(),
        mocked: true,
      };
      setLocation(initialLocation);

      // Add initial data point
      const initialSpeed = getSimulatedNetworkSpeed(
        DEMO_CONFIG.startLocation.latitude,
        DEMO_CONFIG.startLocation.longitude
      );
      setSimulatedSpeed(initialSpeed);
      setNetworkSpeed(initialSpeed);

      const gradient = getHeatmapGradient(initialSpeed);
      setDataPoints([{
        id: Date.now(),
        latitude: DEMO_CONFIG.startLocation.latitude,
        longitude: DEMO_CONFIG.startLocation.longitude,
        speed: initialSpeed,
        timestamp: new Date().toISOString(),
        color: getSpeedColor(initialSpeed),
        gradient: gradient,
      }]);
      setPathCoordinates([{
        latitude: DEMO_CONFIG.startLocation.latitude,
        longitude: DEMO_CONFIG.startLocation.longitude,
      }]);
    }

    // Clear any existing interval
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
    }

    // Start simulation interval
    demoIntervalRef.current = setInterval(demoStep, DEMO_CONFIG.updateIntervalMs);
    setIsSimulating(true);
    setIsTracking(true);
    setNetworkType('demo');
    
    console.log('🚶 Demo simulation started');
  }, [demoStep, getSimulatedNetworkSpeed]);

  // Stop demo simulation
  const stopDemoSimulation = useCallback((): void => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setIsSimulating(false);
    setIsTracking(false);
    console.log('⏸ Demo simulation paused');
  }, []);

  // Reset demo simulation
  const resetDemoSimulation = useCallback((): void => {
    stopDemoSimulation();
    lastDemoLocationRef.current = null;
    directionRef.current = Math.random() * 2 * Math.PI;
    setTotalDistance(0);
    setDataPoints([]);
    setPathCoordinates([]);
    setSimulatedSpeed(35);
    
    // Reset to starting location
    const initialLocation: MockedLocationObject = {
      coords: {
        latitude: DEMO_CONFIG.startLocation.latitude,
        longitude: DEMO_CONFIG.startLocation.longitude,
        altitude: 10,
        accuracy: 5,
      },
      timestamp: Date.now(),
      mocked: true,
    };
    setLocation(initialLocation);
    lastDemoLocationRef.current = {
      latitude: DEMO_CONFIG.startLocation.latitude,
      longitude: DEMO_CONFIG.startLocation.longitude,
    };
    
    console.log('↺ Demo simulation reset');
  }, [stopDemoSimulation]);

  // Request location permissions
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return false;
      }

      // Try to get background permission for continuous tracking
      if (Platform.OS !== 'web') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.log('Background location permission not granted');
        }
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrorMsg('Error requesting permissions: ' + errorMessage);
      return false;
    }
  };

  // Get current location once
  const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      return currentLocation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrorMsg('Error getting location: ' + errorMessage);
      return null;
    }
  };

  // Measure network speed with actual speed test
  const measureNetworkSpeed = useCallback(async (): Promise<number> => {
    try {
      const netInfo = await NetInfo.fetch();
      setNetworkType(netInfo.type as NetworkType);
      
      // Get estimated speed based on connection type
      let estimatedSpeed = await estimateNetworkSpeed(netInfo);
      
      // Perform actual speed test
      const testedSpeed = await performSpeedTest();
      
      // Blend results (favor tested speed when available)
      let finalSpeed: number;
      if (testedSpeed !== null) {
        finalSpeed = (testedSpeed * 0.7) + (estimatedSpeed * 0.3);
      } else {
        finalSpeed = estimatedSpeed;
      }
      
      setNetworkSpeed(finalSpeed);
      return finalSpeed;
    } catch (error) {
      console.log('Error measuring network speed:', error);
      return 0;
    }
  }, []);

  // Add a data point with location and network speed
  const addDataPoint = useCallback((locationData: AppLocationObject, speed: number): void => {
    const gradient = getHeatmapGradient(speed);
    const newPoint: DataPoint = {
      id: Date.now(),
      latitude: locationData.coords.latitude,
      longitude: locationData.coords.longitude,
      speed: speed,
      timestamp: new Date().toISOString(),
      color: getSpeedColor(speed),
      gradient: gradient,
    };

    setDataPoints(prev => [...prev, newPoint]);
    setPathCoordinates(prev => [
      ...prev,
      {
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      },
    ]);
  }, []);

  // Start tracking location
  const startTracking = async (): Promise<void> => {
    // On web with demo mode, use mock location
    if (IS_WEB && demoModeEnabled) {
      startDemoSimulation();
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      // On web, offer demo mode if permission denied
      if (IS_WEB) {
        setDemoModeEnabled(true);
        setErrorMsg(null);
        return;
      }
      Alert.alert('Permission Required', 'Location permission is required to track your position.');
      return;
    }

    // Get initial location
    const initialLocation = await getCurrentLocation();
    if (!initialLocation) {
      // On web, offer demo mode if location fails
      if (IS_WEB) {
        setDemoModeEnabled(true);
        setErrorMsg(null);
        return;
      }
      Alert.alert('Error', 'Could not get your current location.');
      return;
    }

    // Measure initial network speed
    const initialSpeed = await measureNetworkSpeed();
    addDataPoint(initialLocation, initialSpeed);

    // Start watching location
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 2,
      },
      async (newLocation) => {
        setLocation(newLocation);
        
        // Measure network speed at new location
        const speed = await measureNetworkSpeed();
        addDataPoint(newLocation, speed);

        // Center map on new location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }, 500);
        }
      }
    );

    // Subscribe to network state changes
    netInfoSubscription.current = NetInfo.addEventListener(async (state) => {
      setNetworkType(state.type as NetworkType);
      const speed = await estimateNetworkSpeed(state);
      setNetworkSpeed(speed);
    });

    setIsTracking(true);
  };

  // Stop tracking location
  const stopTracking = (): void => {
    // Stop demo mode simulation if active
    if (IS_WEB && demoModeEnabled) {
      stopDemoSimulation();
      return;
    }
    
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (netInfoSubscription.current) {
      netInfoSubscription.current();
      netInfoSubscription.current = null;
    }
    setIsTracking(false);
  };

  // Cleanup demo interval on unmount
  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, []);

  // Clear all data points
  const clearData = (): void => {
    Alert.alert(
      'Clear Data',
      'Are you sure you want to clear all heatmap data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setDataPoints([]);
            setPathCoordinates([]);
          },
        },
      ]
    );
  };

  // Initialize on mount
  useEffect(() => {
    (async () => {
      // On web, default to demo mode
      if (IS_WEB) {
        setDemoModeEnabled(true);
        const startLat = 37.7749;
        const startLng = -122.4194;
        
        lastDemoLocationRef.current = { latitude: startLat, longitude: startLng };
        
        setLocation({
          coords: {
            latitude: startLat,
            longitude: startLng,
            altitude: 10,
            accuracy: 5,
          },
          timestamp: Date.now(),
          mocked: true,
        });
        
        const initialSpeed = getSimulatedNetworkSpeed(startLat, startLng);
        setNetworkSpeed(initialSpeed);
        setSimulatedSpeed(initialSpeed);
        setNetworkType('demo');
        
        console.log('🌐 Web demo mode initialized');
        return;
      }
      
      const hasPermission = await requestPermissions();
      if (hasPermission) {
        await getCurrentLocation();
        await measureNetworkSpeed();
      }
    })();

    // Cleanup on unmount
    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
      stopTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render loading state
  if (!location && !errorMsg) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-5">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-2.5 text-base text-gray-500">
          {demoModeEnabled ? 'Initializing demo...' : 'Getting your location...'}
        </Text>
        {IS_WEB && !demoModeEnabled && (
          <TouchableOpacity 
            className="mt-5 bg-demo px-8 py-3 rounded-lg"
            onPress={() => {
              setDemoModeEnabled(true);
              setLocation({
                coords: { latitude: 37.7749, longitude: -122.4194, altitude: 10, accuracy: 5 },
                timestamp: Date.now(),
                mocked: true,
              });
            }}
          >
            <Text className="text-white text-base font-semibold">🧪 Use Demo Mode</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Render error state
  if (errorMsg) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-5">
        <Text className="text-base text-danger text-center mb-5">{errorMsg}</Text>
        <TouchableOpacity className="bg-primary px-8 py-3 rounded-lg" onPress={requestPermissions}>
          <Text className="text-white text-base font-semibold">Retry</Text>
        </TouchableOpacity>
        {IS_WEB && (
          <TouchableOpacity 
            className="mt-2.5 bg-demo px-8 py-3 rounded-lg"
            onPress={() => {
              setDemoModeEnabled(true);
              setErrorMsg(null);
              setLocation({
                coords: { latitude: 37.7749, longitude: -122.4194, altitude: 10, accuracy: 5 },
                timestamp: Date.now(),
                mocked: true,
              });
            }}
          >
            <Text className="text-white text-base font-semibold">🧪 Use Demo Mode</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Map with heatmap overlay */}
      <MapView
        ref={mapRef}
        style={{ width, height: height * 0.45 }}
        initialRegion={{
          latitude: location?.coords?.latitude ?? 37.7749,
          longitude: location?.coords?.longitude ?? -122.4194,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={!demoModeEnabled}
        showsMyLocationButton
        showsCompass
      >
        {/* Draw path line */}
        {pathCoordinates.length > 1 && (
          <Polyline
            coordinates={pathCoordinates}
            strokeColor="#007AFF"
            strokeWidth={3}
            lineDashPattern={[1]}
          />
        )}

        {/* Draw gradient heatmap circles at each data point */}
        {dataPoints.map((point) => (
          <React.Fragment key={point.id}>
            {/* Outer glow - creates smooth gradient effect */}
            <Circle
              center={{
                latitude: point.latitude,
                longitude: point.longitude,
              }}
              radius={50}
              fillColor={point.gradient?.outer ?? getSpeedColor(point.speed, 0.15)}
              strokeColor="transparent"
              strokeWidth={0}
            />
            {/* Middle ring */}
            <Circle
              center={{
                latitude: point.latitude,
                longitude: point.longitude,
              }}
              radius={32}
              fillColor={point.gradient?.middle ?? getSpeedColor(point.speed, 0.4)}
              strokeColor="transparent"
              strokeWidth={0}
            />
            {/* Inner circle - most saturated */}
            <Circle
              center={{
                latitude: point.latitude,
                longitude: point.longitude,
              }}
              radius={15}
              fillColor={point.gradient?.inner ?? getSpeedColor(point.speed, 0.9)}
              strokeColor="#ffffff"
              strokeWidth={1}
            />
          </React.Fragment>
        ))}

        {/* Current location marker with speed */}
        {location?.coords && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title={`Speed: ${networkSpeed.toFixed(1)} Mbps`}
            description={`Type: ${networkType}`}
          />
        )}
      </MapView>

      {/* Info Panel with Gradient Speed Indicator */}
      <View className="bg-white p-4 border-b border-neutral-200">
        <View className="flex-row items-center mb-2.5">
          {/* Gradient speed indicator */}
          <View className="mr-4">
            <View 
              className="w-18 h-18 rounded-full justify-center items-center"
              style={{ backgroundColor: getSpeedColor(networkSpeed, 0.2) }}
            >
              <View 
                className="w-12 h-12 rounded-full justify-center items-center"
                style={{ backgroundColor: getSpeedColor(networkSpeed, 0.5) }}
              >
                <View 
                  className="w-8 h-8 rounded-full border-2 border-white/70"
                  style={{ backgroundColor: getSpeedColor(networkSpeed, 1) }}
                />
              </View>
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-3xl font-bold text-black">
              {networkSpeed.toFixed(1)} <Text className="text-sm font-normal text-gray-500">Mbps</Text>
            </Text>
            <Text className="text-base font-semibold" style={{ color: getSpeedColor(networkSpeed, 1) }}>
              {getSpeedLabel(networkSpeed)}
            </Text>
            <Text className="text-xs text-gray-400 mt-0.5">{networkType.toUpperCase()}</Text>
          </View>
        </View>
        {/* Mini gradient bar showing current speed position */}
        <View className="my-2 relative">
          <View className="flex-row h-1.5 rounded-sm overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <View 
                key={i} 
                style={[styles.miniGradientSegment, { backgroundColor: getSpeedColor((i / 19) * 100, 1) }]} 
              />
            ))}
          </View>
          <View 
            className="absolute -top-0.5 w-1 h-2.5 bg-black rounded-sm border border-white -ml-0.5"
            style={{ left: `${Math.min(networkSpeed, 100)}%` as unknown as number }}
          />
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-gray-500">📍 Data Points: {dataPoints.length}</Text>
          {demoModeEnabled && (
            <Text className="text-xs text-demo font-semibold">🧪 Demo Mode Active</Text>
          )}
        </View>
      </View>

      {/* Demo Mode Panel (Web only) */}
      {DEMO_MODE_AVAILABLE && demoModeEnabled && (
        <DemoModePanel
          isSimulating={isSimulating}
          onStartSimulation={startDemoSimulation}
          onStopSimulation={stopDemoSimulation}
          onResetSimulation={resetDemoSimulation}
          totalDistance={totalDistance}
          simulatedSpeed={simulatedSpeed}
          visible={true}
        />
      )}

      {/* Control Buttons */}
      <View className="flex-row p-2.5 bg-neutral-100 gap-2.5">
        {demoModeEnabled ? (
          <>
            <TouchableOpacity
              className={`flex-1 py-3.5 rounded-xl items-center ${isSimulating ? 'bg-danger' : 'bg-success'}`}
              onPress={isSimulating ? stopDemoSimulation : startDemoSimulation}
            >
              <Text className="text-white text-base font-semibold">
                {isSimulating ? '⏸ Pause Demo' : '▶ Start Demo'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center bg-warning"
              onPress={resetDemoSimulation}
            >
              <Text className="text-white text-base font-semibold">↺ Reset</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              className={`flex-1 py-3.5 rounded-xl items-center ${isTracking ? 'bg-danger' : 'bg-success'}`}
              onPress={isTracking ? stopTracking : startTracking}
            >
              <Text className="text-white text-base font-semibold">
                {isTracking ? 'Stop Tracking' : 'Start Tracking'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center bg-warning"
              onPress={clearData}
              disabled={dataPoints.length === 0}
            >
              <Text className="text-white text-base font-semibold">Clear Data</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Gradient Legend */}
      <View className="bg-white p-4 border-t border-neutral-200">
        <Text className="text-sm font-semibold text-gray-700 mb-2 text-center">Network Speed (Mbps)</Text>
        <View className="flex-row h-4 rounded-lg overflow-hidden mb-1">
          {Array.from({ length: 30 }).map((_, i) => (
            <View 
              key={i} 
              style={[styles.gradientLegendSegment, { backgroundColor: getSpeedColor((i / 29) * 100, 1) }]} 
            />
          ))}
        </View>
        <View className="flex-row justify-between px-0.5 mb-1">
          <Text className="text-xs text-gray-500">0</Text>
          <Text className="text-xs text-gray-500">25</Text>
          <Text className="text-xs text-gray-500">50</Text>
          <Text className="text-xs text-gray-500">75</Text>
          <Text className="text-xs text-gray-500">100+</Text>
        </View>
        <View className="flex-row justify-around">
          <Text className="text-xs font-medium" style={{ color: getSpeedColor(5, 1) }}>Poor</Text>
          <Text className="text-xs font-medium" style={{ color: getSpeedColor(25, 1) }}>Fair</Text>
          <Text className="text-xs font-medium" style={{ color: getSpeedColor(50, 1) }}>Good</Text>
          <Text className="text-xs font-medium" style={{ color: getSpeedColor(80, 1) }}>Excellent</Text>
        </View>
      </View>
    </View>
  );
}

// Minimal styles for dynamic values that can't be expressed in Tailwind
const styles = StyleSheet.create({
  miniGradientSegment: {
    flex: 1,
    height: '100%',
  },
  gradientLegendSegment: {
    flex: 1,
    height: '100%',
  },
});
