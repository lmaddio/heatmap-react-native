/**
 * Utility functions for heatmap generation and color mapping
 */

import type {
  RGBColor,
  RGBColorWithHex,
  GradientStop,
  HeatmapGradient,
  LegendItem,
  DataPoint,
  DataPointStats,
  MapRegion,
  SpeedQuality,
  Coordinates,
  AppLocationObject,
} from '../types';

// Network speed thresholds (in Mbps)
export const SPEED_THRESHOLDS = {
  EXCELLENT: 50,
  GOOD: 25,
  FAIR: 10,
  POOR: 5,
  VERY_POOR: 1,
} as const;

// Maximum speed for normalization (Mbps)
export const MAX_SPEED = 100;

// Gradient color stops for smooth interpolation
// Format: [position (0-1), { r, g, b }]
export const GRADIENT_STOPS: GradientStop[] = [
  { pos: 0.00, color: { r: 139, g: 0, b: 0 } },      // Dark Red - No signal
  { pos: 0.05, color: { r: 255, g: 0, b: 0 } },      // Red - Very poor
  { pos: 0.15, color: { r: 255, g: 69, b: 0 } },     // Orange-Red
  { pos: 0.25, color: { r: 255, g: 140, b: 0 } },    // Dark Orange
  { pos: 0.35, color: { r: 255, g: 165, b: 0 } },    // Orange
  { pos: 0.45, color: { r: 255, g: 215, b: 0 } },    // Gold
  { pos: 0.55, color: { r: 255, g: 255, b: 0 } },    // Yellow
  { pos: 0.65, color: { r: 173, g: 255, b: 47 } },   // Green-Yellow
  { pos: 0.75, color: { r: 124, g: 252, b: 0 } },    // Lawn Green
  { pos: 0.85, color: { r: 50, g: 205, b: 50 } },    // Lime Green
  { pos: 0.95, color: { r: 0, g: 200, b: 0 } },      // Green
  { pos: 1.00, color: { r: 0, g: 180, b: 0 } },      // Dark Green - Excellent
];

/**
 * Interpolate between two colors
 */
const lerpColor = (color1: RGBColor, color2: RGBColor, t: number): RGBColor => {
  return {
    r: Math.round(color1.r + (color2.r - color1.r) * t),
    g: Math.round(color1.g + (color2.g - color1.g) * t),
    b: Math.round(color1.b + (color2.b - color1.b) * t),
  };
};

/**
 * Get smooth gradient color based on network speed
 * Uses multi-stop gradient interpolation for accurate visualization
 */
export const getSpeedColor = (speedMbps: number, opacity: number = 0.6): string => {
  // Normalize speed to 0-1 range using logarithmic scale for better distribution
  // This gives more color resolution to lower speeds where differences matter more
  const normalizedLinear = Math.min(Math.max(speedMbps, 0) / MAX_SPEED, 1);
  
  // Use a combination of linear and logarithmic scaling
  // log scale emphasizes differences at lower speeds
  const logScale = speedMbps > 0 ? Math.log10(speedMbps + 1) / Math.log10(MAX_SPEED + 1) : 0;
  const normalized = (normalizedLinear * 0.4 + logScale * 0.6); // Blend both scales
  
  // Find the two gradient stops to interpolate between
  let lowerStop = GRADIENT_STOPS[0];
  let upperStop = GRADIENT_STOPS[GRADIENT_STOPS.length - 1];
  
  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    if (normalized >= GRADIENT_STOPS[i].pos && normalized <= GRADIENT_STOPS[i + 1].pos) {
      lowerStop = GRADIENT_STOPS[i];
      upperStop = GRADIENT_STOPS[i + 1];
      break;
    }
  }
  
  // Calculate interpolation factor between the two stops
  const range = upperStop.pos - lowerStop.pos;
  const t = range > 0 ? (normalized - lowerStop.pos) / range : 0;
  
  // Interpolate the color
  const color = lerpColor(lowerStop.color, upperStop.color, t);
  
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
};

/**
 * Get color components as object (for SVG gradients)
 */
export const getSpeedColorComponents = (speedMbps: number): RGBColorWithHex => {
  const rgba = getSpeedColor(speedMbps, 1);
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    return { r, g, b, hex };
  }
  return { r: 128, g: 128, b: 128, hex: '#808080' };
};

/**
 * Generate gradient colors for legend display
 */
export const generateGradientLegend = (steps: number = 10): LegendItem[] => {
  const legend: LegendItem[] = [];
  for (let i = 0; i <= steps; i++) {
    const speed = (i / steps) * MAX_SPEED;
    legend.push({
      speed,
      color: getSpeedColor(speed, 1),
      label: `${speed.toFixed(0)} Mbps`,
    });
  }
  return legend;
};

/**
 * Get gradient color for radial heatmap effect
 * Returns colors for inner, middle, and outer rings
 */
export const getHeatmapGradient = (speedMbps: number): HeatmapGradient => {
  const baseColor = getSpeedColorComponents(speedMbps);
  
  return {
    inner: `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.9)`,
    middle: `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.5)`,
    outer: `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.15)`,
    hex: baseColor.hex,
  };
};

/**
 * Legacy function - now uses gradient
 * @deprecated Use getSpeedColor instead
 */
export const getGradientSpeedColor = getSpeedColor;

/**
 * Get speed category label
 */
export const getSpeedLabel = (speedMbps: number): SpeedQuality => {
  if (speedMbps >= SPEED_THRESHOLDS.EXCELLENT) return 'Excellent';
  if (speedMbps >= SPEED_THRESHOLDS.GOOD) return 'Good';
  if (speedMbps >= SPEED_THRESHOLDS.FAIR) return 'Fair';
  if (speedMbps >= SPEED_THRESHOLDS.POOR) return 'Poor';
  if (speedMbps >= SPEED_THRESHOLDS.VERY_POOR) return 'Very Poor';
  return 'No Signal';
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @returns Distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Convert geographic coordinates to screen coordinates
 */
export const geoToScreen = (
  latitude: number,
  longitude: number,
  region: MapRegion,
  width: number,
  height: number
): { x: number; y: number } => {
  const x = ((longitude - (region.longitude - region.longitudeDelta / 2)) / region.longitudeDelta) * width;
  const y = ((region.latitude + region.latitudeDelta / 2 - latitude) / region.latitudeDelta) * height;
  return { x, y };
};

/**
 * Generate heatmap gradient stops for SVG
 */
export const generateHeatmapGradient = (): Array<{ offset: string; color: string; opacity: number }> => {
  return [
    { offset: '0%', color: 'rgb(255, 0, 0)', opacity: 0.8 },
    { offset: '25%', color: 'rgb(255, 165, 0)', opacity: 0.7 },
    { offset: '50%', color: 'rgb(255, 255, 0)', opacity: 0.6 },
    { offset: '75%', color: 'rgb(144, 238, 144)', opacity: 0.5 },
    { offset: '100%', color: 'rgb(0, 255, 0)', opacity: 0.4 },
  ];
};

/**
 * Create data point object
 */
export const createDataPoint = (location: AppLocationObject, speed: number): DataPoint => {
  const gradient = getHeatmapGradient(speed);
  return {
    id: Date.now() + Math.random(),
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    speed: speed,
    timestamp: new Date().toISOString(),
    color: getSpeedColor(speed),
    gradient: gradient,
    label: getSpeedLabel(speed),
  };
};

/**
 * Calculate average speed from data points
 */
export const calculateAverageSpeed = (dataPoints: DataPoint[]): number => {
  if (dataPoints.length === 0) return 0;
  const sum = dataPoints.reduce((acc, point) => acc + point.speed, 0);
  return sum / dataPoints.length;
};

/**
 * Get statistics from data points
 */
export const calculateStats = (dataPoints: DataPoint[]): DataPointStats => {
  if (dataPoints.length === 0) {
    return {
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      veryPoor: 0,
    };
  }

  const speeds = dataPoints.map((p) => p.speed);
  const sum = speeds.reduce((a, b) => a + b, 0);

  return {
    count: dataPoints.length,
    average: sum / speeds.length,
    min: Math.min(...speeds),
    max: Math.max(...speeds),
    excellent: dataPoints.filter((p) => p.speed >= SPEED_THRESHOLDS.EXCELLENT).length,
    good: dataPoints.filter((p) => p.speed >= SPEED_THRESHOLDS.GOOD && p.speed < SPEED_THRESHOLDS.EXCELLENT).length,
    fair: dataPoints.filter((p) => p.speed >= SPEED_THRESHOLDS.FAIR && p.speed < SPEED_THRESHOLDS.GOOD).length,
    poor: dataPoints.filter((p) => p.speed >= SPEED_THRESHOLDS.POOR && p.speed < SPEED_THRESHOLDS.FAIR).length,
    veryPoor: dataPoints.filter((p) => p.speed < SPEED_THRESHOLDS.POOR).length,
  };
};

export default {
  SPEED_THRESHOLDS,
  MAX_SPEED,
  GRADIENT_STOPS,
  getSpeedColor,
  getSpeedColorComponents,
  getHeatmapGradient,
  getGradientSpeedColor,
  getSpeedLabel,
  calculateDistance,
  geoToScreen,
  generateHeatmapGradient,
  generateGradientLegend,
  createDataPoint,
  calculateAverageSpeed,
  calculateStats,
};
