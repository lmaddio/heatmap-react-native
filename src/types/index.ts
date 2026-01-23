/**
 * Shared type definitions for the heatmap application
 */

import type { LocationObject } from 'expo-location';

// ==================== Location Types ====================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationCoords extends Coordinates {
  altitude?: number | null;
  accuracy?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface MockedLocationObject {
  coords: LocationCoords;
  timestamp: number;
  mocked?: boolean;
}

// Union type for both real and mocked locations
export type AppLocationObject = LocationObject | MockedLocationObject;

// ==================== Map Region Types ====================

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// ==================== Network Types ====================

export type NetworkType =
  | 'wifi'
  | 'cellular'
  | 'ethernet'
  | 'bluetooth'
  | 'unknown'
  | 'none'
  | 'demo';

export type CellularGeneration = '2g' | '3g' | '4g' | '5g' | null;

export type SpeedQuality = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor' | 'No Signal';

// ==================== Data Point Types ====================

export interface HeatmapGradient {
  inner: string;
  middle: string;
  outer: string;
  hex: string;
}

export interface DataPoint {
  id: number | string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
  color: string;
  gradient?: HeatmapGradient;
  label?: SpeedQuality;
}

export interface GradientDataPoint extends DataPoint {
  gradient: HeatmapGradient;
  index: number;
}

// ==================== Statistics Types ====================

export interface DataPointStats {
  count: number;
  average: number;
  min: number;
  max: number;
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  veryPoor: number;
}

export interface HistogramBar {
  count: number;
  height: number;
  speed: number;
  color: string;
}

// ==================== Settings Types ====================

export interface AppSettings {
  trackingInterval: number;
  distanceInterval: number;
  enableSpeedTest: boolean;
  showPath: boolean;
  circleRadius: number;
  autoSave: boolean;
}

// ==================== Session Types ====================

export interface Session {
  id: number;
  createdAt: string;
  dataPoints?: DataPoint[];
  [key: string]: unknown;
}

// ==================== Demo Mode Types ====================

export interface NetworkZone {
  lat: number;
  lng: number;
  radius: number;
  type: 'poor' | 'fair' | 'good' | 'excellent' | 'dead';
  baseSpeed: number;
}

export interface DemoConfig {
  startLocation: Coordinates;
  walkingSpeedMps: number;
  updateIntervalMs: number;
  directionChangeChance: number;
  networkZones: NetworkZone[];
}

// ==================== Color Types ====================

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface RGBColorWithHex extends RGBColor {
  hex: string;
}

export interface GradientStop {
  pos: number;
  color: RGBColor;
}

export interface SpeedMarker {
  speed: number;
  label: string;
}

export interface LegendItem {
  speed: number;
  color: string;
  label: string;
}

// ==================== Export Types ====================

export interface ExportedData {
  exportedAt: string;
  version: string;
  dataPoints: DataPoint[];
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    speed: number;
    label?: SpeedQuality;
    timestamp: string;
    color: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// ==================== Component Props Types ====================

export interface MapViewRef {
  animateToRegion: (region: MapRegion, duration?: number) => void;
}

// Props injected by MapView to child components
export interface MapChildProps {
  _region?: MapRegion;
  _dimensions?: { width: number; height: number };
  _zoom?: number;
  _circleIndex?: number;
}

// ==================== Hook Return Types ====================

export interface UseLocationOptions {
  timeInterval?: number;
  distanceInterval?: number;
  onLocationUpdate?: (location: AppLocationObject) => void;
}

export interface UseLocationReturn {
  location: AppLocationObject | null;
  error: string | null;
  isTracking: boolean;
  hasPermission: boolean;
  requestPermissions: () => Promise<boolean>;
  getCurrentLocation: () => Promise<AppLocationObject | null>;
  startTracking: () => Promise<boolean>;
  stopTracking: () => void;
}

export interface UseNetworkSpeedOptions {
  enableSpeedTest?: boolean;
  testInterval?: number;
  useMultiTest?: boolean;
}

export interface UseNetworkSpeedReturn {
  speed: number;
  networkType: NetworkType;
  isConnected: boolean;
  cellularGeneration: CellularGeneration;
  isTesting: boolean;
  measureSpeed: (doSpeedTest?: boolean) => Promise<number>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

export interface UseMockLocationOptions {
  enabled?: boolean;
  startLocation?: Coordinates;
  onLocationUpdate?: (location: MockedLocationObject) => void;
  onSpeedUpdate?: (speed: number) => void;
  updateInterval?: number;
}

export interface UseMockLocationReturn {
  location: MockedLocationObject | null;
  isSimulating: boolean;
  simulatedSpeed: number;
  totalDistance: number;
  pathHistory: Coordinates[];
  startSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  setStartLocation: (lat: number, lng: number) => void;
  isWebPlatform: boolean;
}
