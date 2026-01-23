/**
 * Default export - this file is used as fallback
 * Platform-specific versions (.web.tsx, .native.tsx) take precedence
 */
import { Platform } from 'react-native';
import type { ComponentType } from 'react';
import type { MapViewRef, MapRegion, Coordinates } from '../types';

// Define common prop types for the map components
export interface MapViewProps {
  style?: object;
  initialRegion?: MapRegion;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  children?: React.ReactNode;
  onRegionChange?: (region: MapRegion) => void;
  ref?: React.Ref<MapViewRef>;
}

export interface CircleProps {
  center: Coordinates;
  radius: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  speed?: number;
  _region?: MapRegion;
  _dimensions?: { width: number; height: number };
  _zoom?: number;
  _circleIndex?: number;
}

export interface PolylineProps {
  coordinates: Coordinates[];
  strokeColor?: string;
  strokeWidth?: number;
  lineDashPattern?: number[];
  speeds?: number[];
  _region?: MapRegion;
  _dimensions?: { width: number; height: number };
  _zoom?: number;
}

export interface MarkerProps {
  coordinate: Coordinates;
  title?: string;
  description?: string;
  _region?: MapRegion;
  _dimensions?: { width: number; height: number };
  _zoom?: number;
}

// Type definitions for the exported components
// Using 'unknown' for the component types because the actual implementation
// varies by platform and we can't know the exact component type at compile time
// in this fallback file
type MapViewComponent = ComponentType<MapViewProps>;
type CircleComponent = ComponentType<CircleProps>;
type PolylineComponent = ComponentType<PolylineProps>;
type MarkerComponent = ComponentType<MarkerProps>;

let MapView: MapViewComponent;
let Circle: CircleComponent;
let Polyline: PolylineComponent;
let Marker: MarkerComponent;

// Dynamic require based on platform (fallback behavior)
if (Platform.OS === 'web') {
  // For web, use the SVG-based implementation
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const WebComponents = require('./MapComponents.web');
  MapView = WebComponents.MapView;
  Circle = WebComponents.Circle;
  Polyline = WebComponents.Polyline;
  Marker = WebComponents.Marker;
} else {
  // For native platforms, use react-native-maps
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default;
  Circle = RNMaps.Circle;
  Polyline = RNMaps.Polyline;
  Marker = RNMaps.Marker;
}

export { MapView, Circle, Polyline, Marker };
export default MapView;
