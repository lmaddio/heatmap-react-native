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
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';

// Platform-specific map components (uses .web.js or .native.js automatically)
import { MapView, Circle, Polyline, Marker } from './src/components/MapComponents';
import DemoModePanel from './src/components/DemoModePanel';

import { 
  getSpeedColor, 
  getSpeedLabel, 
  getHeatmapGradient,
  SPEED_THRESHOLDS 
} from './src/utils/heatmapUtils';

// Check if running in demo/test mode on web
const IS_WEB = Platform.OS === 'web';
const DEMO_MODE_AVAILABLE = IS_WEB;

const { width, height } = Dimensions.get('window');

// Multiple test endpoints to avoid 429/409 rate limiting
const TEST_ENDPOINTS = [
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
const getNextEndpoint = () => {
  const endpoint = TEST_ENDPOINTS[currentEndpointIndex];
  currentEndpointIndex = (currentEndpointIndex + 1) % TEST_ENDPOINTS.length;
  return endpoint;
};

// Estimate network speed based on connection type and details
const estimateNetworkSpeed = async (netInfoState) => {
  if (!netInfoState.isConnected) {
    return 0;
  }

  const { type, details } = netInfoState;
  let baseSpeed = 0;
  
  switch (type) {
    case 'wifi':
      baseSpeed = 50;
      if (details && details.strength) {
        baseSpeed = (details.strength / 100) * 100;
      }
      break;
    case 'cellular':
      if (details && details.cellularGeneration) {
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
const performSpeedTest = async () => {
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
    console.log(`Speed test failed for ${endpoint}:`, error.message);
    return null;
  }
};

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [networkSpeed, setNetworkSpeed] = useState(0);
  const [networkType, setNetworkType] = useState('unknown');
  const [dataPoints, setDataPoints] = useState([]);
  const [pathCoordinates, setPathCoordinates] = useState([]);
  const [demoModeEnabled, setDemoModeEnabled] = useState(IS_WEB);
  
  const mapRef = useRef(null);
  const locationSubscription = useRef(null);
  const netInfoSubscription = useRef(null);
  const demoIntervalRef = useRef(null);

  // Demo simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);
  const [simulatedSpeed, setSimulatedSpeed] = useState(35);
  const directionRef = useRef(Math.random() * 2 * Math.PI);
  const lastDemoLocationRef = useRef(null);

  // Demo mode configuration with diverse network conditions
  const DEMO_CONFIG = {
    startLocation: { latitude: 37.7749, longitude: -122.4194 },
    walkingSpeedMps: 1.4,
    updateIntervalMs: 1000,
    directionChangeChance: 0.15,
    
    // Network zones with different signal qualities
    // type: 'poor' | 'fair' | 'good' | 'excellent' | 'dead'
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

  // Calculate simulated network speed based on location with realistic variations
  const getSimulatedNetworkSpeed = useCallback((lat, lng) => {
    let bestZone = null;
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
    
    let baseSpeed;
    let variationRange;
    
    if (bestZone) {
      // Inside a specific zone
      baseSpeed = bestZone.baseSpeed;
      
      // Variation depends on zone type
      switch (bestZone.type) {
        case 'dead':
          variationRange = 0.5; // Almost no signal
          break;
        case 'poor':
          variationRange = 4; // Unstable connection
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
      // Use perlin-like noise based on position for smooth transitions
      const noiseX = Math.sin(lat * 10000) * Math.cos(lng * 10000);
      const noiseY = Math.cos(lat * 8000) * Math.sin(lng * 12000);
      const noise = (noiseX + noiseY + 2) / 4; // Normalize to 0-1
      
      // Base speed varies from 10 to 60 based on "location noise"
      baseSpeed = 10 + noise * 50;
      variationRange = 15;
    }
    
    // Add random fluctuation (simulates real-world signal instability)
    const fluctuation = (Math.random() - 0.5) * 2 * variationRange;
    
    // Add time-based variation (simulates network congestion)
    const timeVariation = Math.sin(Date.now() / 5000) * 5;
    
    // Calculate final speed
    let finalSpeed = baseSpeed + fluctuation + timeVariation;
    
    // Clamp to realistic range
    finalSpeed = Math.max(0, Math.min(100, finalSpeed));
    
    // Occasionally spike or drop (simulates handoffs, interference)
    if (Math.random() < 0.05) {
      // 5% chance of significant change
      finalSpeed = Math.random() < 0.5 
        ? finalSpeed * 0.3  // Drop
        : Math.min(100, finalSpeed * 1.5); // Spike
    }
    
    return Math.round(finalSpeed * 10) / 10; // Round to 1 decimal
  }, []);

  // Perform one step of demo simulation
  const demoStep = useCallback(() => {
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
    const newLocation = {
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
    const newPoint = {
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
  const startDemoSimulation = useCallback(() => {
    if (!IS_WEB) return;

    // Initialize starting location if needed
    if (!lastDemoLocationRef.current) {
      lastDemoLocationRef.current = {
        latitude: DEMO_CONFIG.startLocation.latitude,
        longitude: DEMO_CONFIG.startLocation.longitude,
      };
      
      const initialLocation = {
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
  const stopDemoSimulation = useCallback(() => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setIsSimulating(false);
    setIsTracking(false);
    console.log('⏸ Demo simulation paused');
  }, []);

  // Reset demo simulation
  const resetDemoSimulation = useCallback(() => {
    stopDemoSimulation();
    lastDemoLocationRef.current = null;
    directionRef.current = Math.random() * 2 * Math.PI;
    setTotalDistance(0);
    setDataPoints([]);
    setPathCoordinates([]);
    setSimulatedSpeed(35);
    
    // Reset to starting location
    const initialLocation = {
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
  const requestPermissions = async () => {
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
      setErrorMsg('Error requesting permissions: ' + error.message);
      return false;
    }
  };

  // Get current location once
  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      return currentLocation;
    } catch (error) {
      setErrorMsg('Error getting location: ' + error.message);
      return null;
    }
  };

  // Measure network speed with actual speed test
  const measureNetworkSpeed = useCallback(async () => {
    try {
      const netInfo = await NetInfo.fetch();
      setNetworkType(netInfo.type);
      
      // Get estimated speed based on connection type
      let estimatedSpeed = await estimateNetworkSpeed(netInfo);
      
      // Perform actual speed test
      const testedSpeed = await performSpeedTest();
      
      // Blend results (favor tested speed when available)
      let finalSpeed;
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
  const addDataPoint = useCallback((locationData, speed) => {
    const gradient = getHeatmapGradient(speed);
    const newPoint = {
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
  const startTracking = async () => {
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
        timeInterval: 1000, // Update every 1 second
        distanceInterval: 2, // Or when moved 2 meters
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
      setNetworkType(state.type);
      const speed = await estimateNetworkSpeed(state);
      setNetworkSpeed(speed);
    });

    setIsTracking(true);
  };

  // Stop tracking location
  const stopTracking = () => {
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
  const clearData = () => {
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
  }, []);

  // Render loading state
  if (!location && !errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {demoModeEnabled ? 'Initializing demo...' : 'Getting your location...'}
        </Text>
        {IS_WEB && !demoModeEnabled && (
          <TouchableOpacity 
            style={[styles.retryButton, { marginTop: 20, backgroundColor: '#4caf50' }]} 
            onPress={() => {
              setDemoModeEnabled(true);
              setLocation({
                coords: { latitude: 37.7749, longitude: -122.4194, altitude: 10, accuracy: 5 },
                timestamp: Date.now(),
                mocked: true,
              });
            }}
          >
            <Text style={styles.retryButtonText}>🧪 Use Demo Mode</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Render error state
  if (errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestPermissions}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        {IS_WEB && (
          <TouchableOpacity 
            style={[styles.retryButton, { marginTop: 10, backgroundColor: '#4caf50' }]} 
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
            <Text style={styles.retryButtonText}>🧪 Use Demo Mode</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Map with heatmap overlay */}
      <MapView
        ref={mapRef}
        style={styles.map}
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
              fillColor={point.gradient?.outer || getSpeedColor(point.speed, 0.15)}
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
              fillColor={point.gradient?.middle || getSpeedColor(point.speed, 0.4)}
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
              fillColor={point.gradient?.inner || getSpeedColor(point.speed, 0.9)}
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
      <View style={styles.infoPanel}>
        <View style={styles.speedContainer}>
          {/* Gradient speed indicator */}
          <View style={styles.speedIndicatorContainer}>
            <View style={[styles.speedIndicatorOuter, { backgroundColor: getSpeedColor(networkSpeed, 0.2) }]}>
              <View style={[styles.speedIndicatorMiddle, { backgroundColor: getSpeedColor(networkSpeed, 0.5) }]}>
                <View style={[styles.speedIndicatorInner, { backgroundColor: getSpeedColor(networkSpeed, 1) }]} />
              </View>
            </View>
          </View>
          <View style={styles.speedInfo}>
            <Text style={styles.speedValue}>{networkSpeed.toFixed(1)} <Text style={styles.speedUnit}>Mbps</Text></Text>
            <Text style={[styles.speedLabel, { color: getSpeedColor(networkSpeed, 1) }]}>{getSpeedLabel(networkSpeed)}</Text>
            <Text style={styles.networkType}>{networkType.toUpperCase()}</Text>
          </View>
        </View>
        {/* Mini gradient bar showing current speed position */}
        <View style={styles.miniGradientContainer}>
          <View style={styles.miniGradientBar}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.miniGradientSegment, 
                  { backgroundColor: getSpeedColor((i / 19) * 100, 1) }
                ]} 
              />
            ))}
          </View>
          <View style={[styles.speedMarker, { left: `${Math.min(networkSpeed, 100)}%` }]} />
        </View>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>📍 Data Points: {dataPoints.length}</Text>
          {demoModeEnabled && (
            <Text style={styles.demoModeText}>🧪 Demo Mode Active</Text>
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
      <View style={styles.controlPanel}>
        {demoModeEnabled ? (
          <>
            <TouchableOpacity
              style={[styles.button, isSimulating ? styles.stopButton : styles.startButton]}
              onPress={isSimulating ? stopDemoSimulation : startDemoSimulation}
            >
              <Text style={styles.buttonText}>
                {isSimulating ? '⏸ Pause Demo' : '▶ Start Demo'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={resetDemoSimulation}
            >
              <Text style={styles.buttonText}>↺ Reset</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, isTracking ? styles.stopButton : styles.startButton]}
              onPress={isTracking ? stopTracking : startTracking}
            >
              <Text style={styles.buttonText}>
                {isTracking ? 'Stop Tracking' : 'Start Tracking'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearData}
              disabled={dataPoints.length === 0}
            >
              <Text style={styles.buttonText}>Clear Data</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Gradient Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Network Speed (Mbps)</Text>
        <View style={styles.gradientLegendBar}>
          {Array.from({ length: 30 }).map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.gradientLegendSegment, 
                { backgroundColor: getSpeedColor((i / 29) * 100, 1) }
              ]} 
            />
          ))}
        </View>
        <View style={styles.legendLabels}>
          <Text style={styles.legendLabelText}>0</Text>
          <Text style={styles.legendLabelText}>25</Text>
          <Text style={styles.legendLabelText}>50</Text>
          <Text style={styles.legendLabelText}>75</Text>
          <Text style={styles.legendLabelText}>100+</Text>
        </View>
        <View style={styles.legendQuality}>
          <Text style={[styles.qualityText, { color: getSpeedColor(5, 1) }]}>Poor</Text>
          <Text style={[styles.qualityText, { color: getSpeedColor(25, 1) }]}>Fair</Text>
          <Text style={[styles.qualityText, { color: getSpeedColor(50, 1) }]}>Good</Text>
          <Text style={[styles.qualityText, { color: getSpeedColor(80, 1) }]}>Excellent</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  map: {
    width: width,
    height: height * 0.5,
  },
  infoPanel: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  speedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedIndicatorContainer: {
    marginRight: 15,
  },
  speedIndicatorOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedIndicatorMiddle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedIndicatorInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  speedInfo: {
    flex: 1,
  },
  speedValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  speedUnit: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#666',
  },
  speedLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  networkType: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  miniGradientContainer: {
    marginTop: 12,
    marginBottom: 8,
    position: 'relative',
  },
  miniGradientBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  miniGradientSegment: {
    flex: 1,
    height: '100%',
  },
  speedMarker: {
    position: 'absolute',
    top: -3,
    width: 4,
    height: 14,
    backgroundColor: '#000',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#fff',
    marginLeft: -2,
  },
  statsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  demoModeText: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
    marginTop: 4,
  },
  controlPanel: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'space-around',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  clearButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  legend: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  gradientLegendBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  gradientLegendSegment: {
    flex: 1,
    height: '100%',
  },
  legendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  legendLabelText: {
    fontSize: 10,
    color: '#999',
  },
  legendQuality: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  qualityText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
