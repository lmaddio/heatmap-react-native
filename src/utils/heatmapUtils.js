/**
 * Utility functions for heatmap generation and color mapping
 */

// Network speed thresholds (in Mbps)
export const SPEED_THRESHOLDS = {
  EXCELLENT: 50,
  GOOD: 25,
  FAIR: 10,
  POOR: 5,
  VERY_POOR: 1,
};

// Maximum speed for normalization (Mbps)
export const MAX_SPEED = 100;

// Gradient color stops for smooth interpolation
// Format: [position (0-1), { r, g, b }]
export const GRADIENT_STOPS = [
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
 * @param {Object} color1 - First color {r, g, b}
 * @param {Object} color2 - Second color {r, g, b}
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Object} Interpolated color {r, g, b}
 */
const lerpColor = (color1, color2, t) => {
  return {
    r: Math.round(color1.r + (color2.r - color1.r) * t),
    g: Math.round(color1.g + (color2.g - color1.g) * t),
    b: Math.round(color1.b + (color2.b - color1.b) * t),
  };
};

/**
 * Get smooth gradient color based on network speed
 * Uses multi-stop gradient interpolation for accurate visualization
 * @param {number} speedMbps - Network speed in Mbps
 * @param {number} opacity - Color opacity (0-1)
 * @returns {string} RGBA color string
 */
export const getSpeedColor = (speedMbps, opacity = 0.6) => {
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
 * @param {number} speedMbps - Network speed in Mbps
 * @returns {Object} Color object {r, g, b, hex}
 */
export const getSpeedColorComponents = (speedMbps) => {
  const rgba = getSpeedColor(speedMbps, 1);
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    return { r, g, b, hex };
  }
  return { r: 128, g: 128, b: 128, hex: '#808080' };
};

/**
 * Generate gradient colors for legend display
 * @param {number} steps - Number of color steps
 * @returns {Array} Array of {speed, color, label} objects
 */
export const generateGradientLegend = (steps = 10) => {
  const legend = [];
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
 * @param {number} speedMbps - Network speed in Mbps
 * @returns {Object} Gradient colors {inner, middle, outer}
 */
export const getHeatmapGradient = (speedMbps) => {
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
 * @param {number} speedMbps - Network speed in Mbps
 * @returns {string} Category label
 */
export const getSpeedLabel = (speedMbps) => {
  if (speedMbps >= SPEED_THRESHOLDS.EXCELLENT) return 'Excellent';
  if (speedMbps >= SPEED_THRESHOLDS.GOOD) return 'Good';
  if (speedMbps >= SPEED_THRESHOLDS.FAIR) return 'Fair';
  if (speedMbps >= SPEED_THRESHOLDS.POOR) return 'Poor';
  if (speedMbps >= SPEED_THRESHOLDS.VERY_POOR) return 'Very Poor';
  return 'No Signal';
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @param {Object} region - Map region (latitudeDelta, longitudeDelta, etc.)
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @returns {Object} Screen coordinates {x, y}
 */
export const geoToScreen = (latitude, longitude, region, width, height) => {
  const x = ((longitude - (region.longitude - region.longitudeDelta / 2)) / region.longitudeDelta) * width;
  const y = ((region.latitude + region.latitudeDelta / 2 - latitude) / region.latitudeDelta) * height;
  return { x, y };
};

/**
 * Generate heatmap gradient stops for SVG
 * @returns {Array} Array of gradient stops
 */
export const generateHeatmapGradient = () => {
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
 * @param {Object} location - Location data
 * @param {number} speed - Network speed in Mbps
 * @returns {Object} Data point object
 */
export const createDataPoint = (location, speed) => {
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
 * @param {Array} dataPoints - Array of data points
 * @returns {number} Average speed in Mbps
 */
export const calculateAverageSpeed = (dataPoints) => {
  if (dataPoints.length === 0) return 0;
  const sum = dataPoints.reduce((acc, point) => acc + point.speed, 0);
  return sum / dataPoints.length;
};

/**
 * Get statistics from data points
 * @param {Array} dataPoints - Array of data points
 * @returns {Object} Statistics object
 */
export const calculateStats = (dataPoints) => {
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
