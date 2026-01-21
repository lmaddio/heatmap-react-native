/**
 * Alternative modular implementation using custom hooks and components
 * This version provides more flexibility and better separation of concerns
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useLocation } from './hooks/useLocation';
import { useNetworkSpeed } from './hooks/useNetworkSpeed';
import {
  HeatmapOverlay,
  SpeedIndicator,
  ControlButtons,
  Legend,
  StatsPanel,
} from './components';
import { createDataPoint } from './utils/heatmapUtils';

// Platform-specific map components
import { MapView, Marker } from './components/MapComponents';

const { width, height } = Dimensions.get('window');

export default function App() {
  // Custom hooks for location and network
  const {
    location,
    error: locationError,
    isTracking,
    hasPermission,
    startTracking: startLocationTracking,
    stopTracking: stopLocationTracking,
  } = useLocation({
    timeInterval: 1000,
    distanceInterval: 2,
    onLocationUpdate: handleLocationUpdate,
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

  // Local state
  const [dataPoints, setDataPoints] = useState([]);
  const [pathCoordinates, setPathCoordinates] = useState([]);
  const [isReady, setIsReady] = useState(false);
  
  const mapRef = useRef(null);

  // Handle location updates
  function handleLocationUpdate(newLocation) {
    // Add data point with current network speed
    const point = createDataPoint(newLocation, speed);
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
  }

  // Start tracking handler
  const handleStartTracking = useCallback(async () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Location permission is required to track your position.'
      );
      return;
    }

    // Add initial data point
    if (location) {
      const initialSpeed = await measureSpeed(false);
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

    await startLocationTracking();
  }, [hasPermission, location, measureSpeed, startLocationTracking]);

  // Stop tracking handler
  const handleStopTracking = useCallback(() => {
    stopLocationTracking();
  }, [stopLocationTracking]);

  // Clear data handler
  const handleClearData = useCallback(() => {
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
  }, []);

  // Initialize
  useEffect(() => {
    if (location && !isReady) {
      setIsReady(true);
    }
  }, [location, isReady]);

  // Render loading state
  if (!location && !locationError) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </SafeAreaView>
    );
  }

  // Render error state
  if (locationError) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{locationError}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Map with heatmap overlay */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        <HeatmapOverlay
          dataPoints={dataPoints}
          pathCoordinates={pathCoordinates}
          showPath={true}
        />

        {/* Current location marker */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title={`Speed: ${speed.toFixed(1)} Mbps`}
            description={`Type: ${networkType}`}
          />
        )}
      </MapView>

      {/* Scrollable info panel */}
      <ScrollView style={styles.infoScrollView} bounces={false}>
        {/* Speed Indicator */}
        <View style={styles.speedPanel}>
          <SpeedIndicator
            speed={speed}
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
      </ScrollView>
    </SafeAreaView>
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
  },
  map: {
    width: width,
    height: height * 0.45,
  },
  infoScrollView: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  speedPanel: {
    padding: 15,
    backgroundColor: '#fff',
  },
});
