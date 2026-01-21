/**
 * Default export - this file is used as fallback
 * Platform-specific versions (.web.js, .native.js) take precedence
 */
import { Platform } from 'react-native';

let MapView, Circle, Polyline, Marker;

// Dynamic require based on platform (fallback behavior)
if (Platform.OS === 'web') {
  // For web, use the SVG-based implementation
  const WebComponents = require('./MapComponents.web');
  MapView = WebComponents.MapView;
  Circle = WebComponents.Circle;
  Polyline = WebComponents.Polyline;
  Marker = WebComponents.Marker;
} else {
  // For native platforms, use react-native-maps
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default;
  Circle = RNMaps.Circle;
  Polyline = RNMaps.Polyline;
  Marker = RNMaps.Marker;
}

export { MapView, Circle, Polyline, Marker };
export default MapView;
