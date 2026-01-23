/**
 * Alternative modular implementation using custom hooks and components
 * This version provides more flexibility and better separation of concerns
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import './global.css';

import { useLocation } from './hooks/useLocation';
import { useMockLocation } from './hooks/useMockLocation';
import { useNetworkSpeed } from './hooks/useNetworkSpeed';
import { useAuth } from './contexts/AuthContext';
import {
  HeatmapOverlay,
  SpeedIndicator,
  ControlButtons,
  Legend,
  StatsPanel,
  LogoutIcon,
} from './components';
import { createDataPoint } from './utils/heatmapUtils';

// Platform-specific map components
import { MapView, Marker } from './components/MapComponents';

import type {
  DataPoint,
  Coordinates,
  AppLocationObject,
  MapViewRef,
} from './types';

const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 1200;

// Default location for web (San Francisco)
const DEFAULT_LOCATION: AppLocationObject = {
  coords: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 10,
    accuracy: 5,
    altitudeAccuracy: 5,
    heading: 0,
    speed: 0,
  },
  timestamp: Date.now(),
};

// Header component with logout
interface HeaderProps {
  userName?: string;
  onLogout: () => void;
  isWideScreen: boolean;
}

function Header({ userName, onLogout, isWideScreen }: HeaderProps): React.JSX.Element {
  return (
    <View className="bg-green-600 px-4 py-3 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <Text className="text-2xl">📡</Text>
        <View>
          <Text className="text-white text-lg font-bold">Network Heatmap</Text>
          {userName && isWideScreen && (
            <Text className="text-green-100 text-xs">Welcome, {userName}</Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        onPress={onLogout}
        className="flex-row items-center gap-2 bg-green-700 px-3 py-2 rounded-lg active:bg-green-800"
      >
        <LogoutIcon size={20} color="#fff" />
        {isWideScreen && (
          <Text className="text-white text-sm font-medium">Logout</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function App(): React.JSX.Element {
  // Get window dimensions for responsive layout
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isWideScreen = windowWidth >= 768;
  const contentWidth = Math.min(windowWidth, MAX_WIDTH);
  
  // Auth context
  const { user, logout } = useAuth();

  // Local state
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [pathCoordinates, setPathCoordinates] = useState<Coordinates[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isReady, setIsReady] = useState(isWeb); // Web is ready immediately with mock
  
  const mapRef = useRef<MapViewRef>(null);
  const speedRef = useRef(0);

  // Native location hook (only used on native platforms)
  const nativeLocation = useLocation({
    timeInterval: 1000,
    distanceInterval: 2,
  });

  // Mock location hook (used on web)
  const mockLocation = useMockLocation({
    enabled: false,
    updateInterval: 1000,
  });

  const {
    speed,
    networkType,
    isConnected,
    cellularGeneration,
    isTesting,
    measureSpeed,
  } = useNetworkSpeed({
    enableSpeedTest: true,
    testInterval: 1000,
  });

  // Keep speed ref updated
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Get current location based on platform
  const location: AppLocationObject | null = isWeb 
    ? (mockLocation.location || DEFAULT_LOCATION)
    : nativeLocation.location;

  const locationError = isWeb ? null : nativeLocation.error;
  const hasPermission = isWeb ? true : nativeLocation.hasPermission;

  // Handle location updates for tracking
  const addDataPoint = useCallback((newLocation: AppLocationObject) => {
    const point = createDataPoint(newLocation, speedRef.current);
    setDataPoints((prev) => [...prev, point]);
    setPathCoordinates((prev) => [
      ...prev,
      {
        latitude: newLocation.coords.latitude,
        longitude: newLocation.coords.longitude,
      },
    ]);

    // Center map on new location
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  }, []);

  // Watch for mock location updates when tracking on web
  useEffect(() => {
    if (isWeb && isTracking && mockLocation.location) {
      addDataPoint(mockLocation.location);
    }
  }, [isWeb, isTracking, mockLocation.location, addDataPoint]);

  // Watch for native location updates when tracking on native
  useEffect(() => {
    if (!isWeb && isTracking && nativeLocation.location && nativeLocation.isTracking) {
      addDataPoint(nativeLocation.location);
    }
  }, [isWeb, isTracking, nativeLocation.location, nativeLocation.isTracking, addDataPoint]);

  // Start tracking handler
  const handleStartTracking = useCallback(async (): Promise<void> => {
    if (!isWeb && !hasPermission) {
      Alert.alert(
        'Permission Required',
        'Location permission is required to track your position.'
      );
      return;
    }

    // Add initial data point
    if (location) {
      const initialSpeed = await measureSpeed(false);
      speedRef.current = initialSpeed;
      const point = createDataPoint(location, initialSpeed);
      setDataPoints((prev) => [...prev, point]);
      setPathCoordinates((prev) => [
        ...prev,
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      ]);
    }

    setIsTracking(true);

    if (isWeb) {
      // Start mock location simulation on web
      mockLocation.startSimulation();
    } else {
      // Start real location tracking on native
      await nativeLocation.startTracking();
    }
  }, [hasPermission, location, measureSpeed, isWeb, mockLocation, nativeLocation]);

  // Stop tracking handler
  const handleStopTracking = useCallback((): void => {
    setIsTracking(false);
    
    if (isWeb) {
      mockLocation.stopSimulation();
    } else {
      nativeLocation.stopTracking();
    }
  }, [isWeb, mockLocation, nativeLocation]);

  // Clear data handler
  const handleClearData = useCallback((): void => {
    if (isWeb) {
      // Direct clear on web (no Alert)
      setDataPoints([]);
      setPathCoordinates([]);
      if (isWeb) {
        mockLocation.resetSimulation();
      }
    } else {
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
    }
  }, [isWeb, mockLocation]);

  // Initialize for native - wait for location
  useEffect(() => {
    if (!isWeb && nativeLocation.location && !isReady) {
      setIsReady(true);
    }
  }, [isWeb, nativeLocation.location, isReady]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    if (isTracking) {
      handleStopTracking();
    }
    await logout();
  }, [isTracking, handleStopTracking, logout]);

  // Calculate responsive dimensions
  const mapHeight = isWideScreen 
    ? Math.min(windowHeight * 0.5, 500) 
    : windowHeight * 0.35;

  // Render loading state (native only)
  if (!isWeb && !location && !locationError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white p-5">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="mt-2.5 text-base text-gray-500">Getting your location...</Text>
      </SafeAreaView>
    );
  }

  // Render error state (native only)
  if (!isWeb && locationError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white p-5">
        <Text className="text-base text-danger text-center">{locationError}</Text>
      </SafeAreaView>
    );
  }

  // Ensure we have a location (use default for web)
  const displayLocation = location || DEFAULT_LOCATION;

  // Wrapper for centered max-width content
  const ContentWrapper = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <View 
      className={`w-full self-center ${className}`}
      style={{ maxWidth: MAX_WIDTH }}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar style="light" />

      {/* Header */}
      <Header 
        userName={user?.name} 
        onLogout={handleLogout}
        isWideScreen={isWideScreen}
      />

      {/* Web Demo Mode Banner */}
      {isWeb && (
        <View className="bg-green-500 py-1.5 px-4">
          <Text className="text-white text-center text-xs font-medium">
            🌐 Web Demo Mode - Using simulated location data
          </Text>
        </View>
      )}

      {/* Main Content */}
      <ScrollView 
        className="flex-1" 
        bounces={false}
        contentContainerStyle={{ 
          alignItems: 'center',
          paddingBottom: 20,
        }}
      >
        <ContentWrapper>
          {/* Map with heatmap overlay */}
          <View className="bg-white rounded-none md:rounded-xl overflow-hidden md:mt-4 shadow-sm">
            <MapView
              ref={mapRef}
              style={{ 
                width: '100%', 
                height: mapHeight,
              }}
              initialRegion={{
                latitude: displayLocation.coords.latitude,
                longitude: displayLocation.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={!isWeb}
              showsMyLocationButton={!isWeb}
              showsCompass
            >
              <HeatmapOverlay
                dataPoints={dataPoints}
                pathCoordinates={pathCoordinates}
                showPath={true}
              />

              {/* Current location marker */}
              <Marker
                coordinate={{
                  latitude: displayLocation.coords.latitude,
                  longitude: displayLocation.coords.longitude,
                }}
                title={`Speed: ${speed.toFixed(1)} Mbps`}
                description={`Type: ${networkType}`}
              />
            </MapView>
          </View>

          {/* Responsive grid for wide screens */}
          {isWideScreen ? (
            <View className="flex-row gap-4 mt-4 px-4">
              {/* Left column - Speed & Controls */}
              <View className="flex-1">
                {/* Speed Indicator */}
                <View className="p-4 bg-white rounded-xl shadow-sm">
                  <SpeedIndicator
                    speed={isWeb ? mockLocation.simulatedSpeed || speed : speed}
                    networkType={networkType}
                    cellularGeneration={cellularGeneration}
                    isConnected={isConnected}
                    isTesting={isTesting}
                  />
                </View>

                {/* Control Buttons */}
                <View className="mt-4">
                  <ControlButtons
                    isTracking={isTracking}
                    onStartTracking={handleStartTracking}
                    onStopTracking={handleStopTracking}
                    onClearData={handleClearData}
                    dataPointsCount={dataPoints.length}
                  />
                </View>
              </View>

              {/* Right column - Stats & Legend */}
              <View className="flex-1">
                {/* Stats Panel */}
                <StatsPanel dataPoints={dataPoints} />

                {/* Legend */}
                <View className="mt-4">
                  <Legend collapsed={false} />
                </View>
              </View>
            </View>
          ) : (
            /* Stacked layout for narrow screens */
            <View className="mt-2">
              {/* Speed Indicator */}
              <View className="p-4 bg-white">
                <SpeedIndicator
                  speed={isWeb ? mockLocation.simulatedSpeed || speed : speed}
                  networkType={networkType}
                  cellularGeneration={cellularGeneration}
                  isConnected={isConnected}
                  isTesting={isTesting}
                />
              </View>

              {/* Control Buttons */}
              <ControlButtons
                isTracking={isTracking}
                onStartTracking={handleStartTracking}
                onStopTracking={handleStopTracking}
                onClearData={handleClearData}
                dataPointsCount={dataPoints.length}
              />

              {/* Stats Panel */}
              <StatsPanel dataPoints={dataPoints} />

              {/* Legend */}
              <Legend collapsed={true} />
            </View>
          )}
        </ContentWrapper>
      </ScrollView>
    </SafeAreaView>
  );
}
