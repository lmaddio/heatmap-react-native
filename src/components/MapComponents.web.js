/**
 * Web platform map components using SVG-based implementation
 */
import React, { forwardRef, useImperativeHandle, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { 
  Circle as SvgCircle, 
  Polyline as SvgPolyline, 
  G, 
  Text as SvgText,
  Defs,
  RadialGradient,
  Stop,
  LinearGradient,
} from 'react-native-svg';
import { getHeatmapGradient, getSpeedColorComponents } from '../utils/heatmapUtils';

// Constants for coordinate conversion
const DEFAULT_ZOOM = 15;
const TILE_SIZE = 256;

// Convert lat/lng to pixel coordinates
const latLngToPixel = (lat, lng, centerLat, centerLng, zoom, width, height) => {
  const scale = Math.pow(2, zoom);
  const latRad = (lat * Math.PI) / 180;
  const centerLatRad = (centerLat * Math.PI) / 180;
  
  const x = ((lng - centerLng) / 360) * TILE_SIZE * scale + width / 2;
  
  const yCenter = (1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) / 2 * TILE_SIZE * scale;
  const yPoint = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * TILE_SIZE * scale;
  const y = yPoint - yCenter + height / 2;
  
  return { x, y };
};

// MapView component for web
export const MapView = forwardRef(({
  style,
  initialRegion,
  showsUserLocation,
  showsMyLocationButton,
  showsCompass,
  children,
  onRegionChange,
}, ref) => {
  const [region, setRegion] = useState(initialRegion);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    if (region && region.latitudeDelta) {
      const newZoom = Math.log2(360 / region.latitudeDelta);
      setZoom(Math.min(Math.max(newZoom, 1), 20));
    }
  }, [region]);

  useImperativeHandle(ref, () => ({
    animateToRegion: (newRegion, duration) => {
      setRegion(newRegion);
      if (onRegionChange) {
        onRegionChange(newRegion);
      }
    },
  }));

  const handleLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  // Recursively pass region info to all children (including nested ones in Fragments)
  const cloneWithProps = (element, index = 0) => {
    if (!element) return null;
    if (!React.isValidElement(element)) return element;
    
    // Check if it's a Fragment (React.Fragment or <></>)
    const isFragment = element.type === React.Fragment || element.type?.toString() === 'Symbol(react.fragment)';
    
    if (isFragment) {
      // For fragments, just process their children
      const fragmentChildren = element.props.children;
      if (fragmentChildren) {
        const processedChildren = React.Children.map(fragmentChildren, (child, childIndex) => 
          cloneWithProps(child, index * 1000 + childIndex)
        );
        return <React.Fragment key={element.key || index}>{processedChildren}</React.Fragment>;
      }
      return null;
    }
    
    // For regular elements, clone with region props
    const newProps = {
      _region: region,
      _dimensions: dimensions,
      _zoom: zoom,
      _circleIndex: index,
    };
    
    // If this element has children that need processing
    const childrenOfElement = element.props.children;
    if (childrenOfElement && React.Children.count(childrenOfElement) > 0) {
      const processedChildren = React.Children.map(childrenOfElement, (child, childIndex) => 
        cloneWithProps(child, index * 1000 + childIndex)
      );
      return React.cloneElement(element, newProps, processedChildren);
    }
    
    return React.cloneElement(element, newProps);
  };

  const renderChildren = () => {
    return React.Children.map(children, (child, index) => cloneWithProps(child, index));
  };

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      <View style={styles.gridBackground}>
        <Svg width={dimensions.width} height={dimensions.height}>
          {/* Background grid */}
          <G stroke="#E8E8E8" strokeWidth="1">
            {Array.from({ length: Math.ceil(dimensions.width / 40) + 1 }).map((_, i) => (
              <SvgPolyline
                key={`v-${i}`}
                points={`${i * 40},0 ${i * 40},${dimensions.height}`}
              />
            ))}
            {Array.from({ length: Math.ceil(dimensions.height / 40) + 1 }).map((_, i) => (
              <SvgPolyline
                key={`h-${i}`}
                points={`0,${i * 40} ${dimensions.width},${i * 40}`}
              />
            ))}
          </G>
          
          {renderChildren()}
          
          {/* User location */}
          {showsUserLocation && region && (
            <G>
              <SvgCircle
                cx={dimensions.width / 2}
                cy={dimensions.height / 2}
                r={24}
                fill="rgba(0, 122, 255, 0.15)"
              />
              <SvgCircle
                cx={dimensions.width / 2}
                cy={dimensions.height / 2}
                r={10}
                fill="#007AFF"
                stroke="#fff"
                strokeWidth={3}
              />
            </G>
          )}
        </Svg>
      </View>
      
      <View style={styles.coordsOverlay}>
        <Text style={styles.coordsText}>
          📍 {region?.latitude?.toFixed(5) || '0'}, {region?.longitude?.toFixed(5) || '0'}
        </Text>
      </View>

      <View style={styles.webNotice}>
        <Text style={styles.webNoticeText}>
          🌐 Web Preview - For full map experience, use iOS/Android
        </Text>
      </View>
    </View>
  );
});

// Circle component with gradient support
export const Circle = ({ 
  center, 
  radius, 
  fillColor, 
  strokeColor, 
  strokeWidth, 
  speed, // Optional: network speed for gradient
  _region, 
  _dimensions, 
  _zoom,
  _circleIndex = 0,
}) => {
  if (!_region || !_dimensions || !center) return null;
  
  const { x, y } = latLngToPixel(
    center.latitude,
    center.longitude,
    _region.latitude,
    _region.longitude,
    _zoom || DEFAULT_ZOOM,
    _dimensions.width,
    _dimensions.height
  );
  
  const metersPerPixel = (156543.03392 * Math.cos((_region.latitude * Math.PI) / 180)) / Math.pow(2, _zoom || DEFAULT_ZOOM);
  const radiusInPixels = Math.max(radius / metersPerPixel, 12);
  
  // Generate gradient ID for this circle
  const gradientId = `heatmap-gradient-${_circleIndex}-${center.latitude.toFixed(4)}-${center.longitude.toFixed(4)}`;
  
  // If speed is provided, create a radial gradient
  if (speed !== undefined) {
    const gradient = getHeatmapGradient(speed);
    
    return (
      <G>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={gradient.inner} stopOpacity="1" />
            <Stop offset="40%" stopColor={gradient.middle} stopOpacity="0.7" />
            <Stop offset="70%" stopColor={gradient.outer} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={gradient.outer} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {/* Outer glow */}
        <SvgCircle
          cx={x}
          cy={y}
          r={radiusInPixels * 2}
          fill={`url(#${gradientId})`}
        />
        {/* Inner solid circle */}
        <SvgCircle
          cx={x}
          cy={y}
          r={radiusInPixels * 0.4}
          fill={gradient.inner}
          stroke="#fff"
          strokeWidth={1}
          strokeOpacity={0.5}
        />
      </G>
    );
  }
  
  // Fallback to simple circle if no speed provided
  return (
    <SvgCircle
      cx={x}
      cy={y}
      r={radiusInPixels}
      fill={fillColor || 'rgba(0, 0, 255, 0.3)'}
      stroke={strokeColor || 'transparent'}
      strokeWidth={strokeWidth || 0}
    />
  );
};

// Polyline component with gradient path support
export const Polyline = ({ 
  coordinates, 
  strokeColor, 
  strokeWidth, 
  lineDashPattern, 
  speeds, // Optional: array of speeds for gradient path
  _region, 
  _dimensions, 
  _zoom 
}) => {
  if (!_region || !_dimensions || !coordinates || coordinates.length < 2) return null;
  
  const screenPoints = coordinates.map((coord) => {
    return latLngToPixel(
      coord.latitude,
      coord.longitude,
      _region.latitude,
      _region.longitude,
      _zoom || DEFAULT_ZOOM,
      _dimensions.width,
      _dimensions.height
    );
  });
  
  // If speeds are provided, draw individual colored segments
  if (speeds && speeds.length >= coordinates.length - 1) {
    return (
      <G>
        {screenPoints.slice(0, -1).map((point, index) => {
          const nextPoint = screenPoints[index + 1];
          const segmentSpeed = speeds[index] || 0;
          const color = getSpeedColorComponents(segmentSpeed);
          
          return (
            <SvgPolyline
              key={`segment-${index}`}
              points={`${point.x},${point.y} ${nextPoint.x},${nextPoint.y}`}
              fill="none"
              stroke={color.hex}
              strokeWidth={strokeWidth || 4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.8}
            />
          );
        })}
      </G>
    );
  }
  
  // Simple single-color polyline
  const points = screenPoints.map(p => `${p.x},${p.y}`).join(' ');
  
  return (
    <SvgPolyline
      points={points}
      fill="none"
      stroke={strokeColor || '#007AFF'}
      strokeWidth={strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={lineDashPattern ? lineDashPattern.join(',') : undefined}
    />
  );
};

// Marker component
export const Marker = ({ coordinate, title, description, _region, _dimensions, _zoom }) => {
  if (!_region || !_dimensions || !coordinate) return null;
  
  const { x, y } = latLngToPixel(
    coordinate.latitude,
    coordinate.longitude,
    _region.latitude,
    _region.longitude,
    _zoom || DEFAULT_ZOOM,
    _dimensions.width,
    _dimensions.height
  );
  
  return (
    <G>
      <SvgCircle cx={x} cy={y} r={14} fill="#FF3B30" stroke="#fff" strokeWidth={2} />
      <SvgText x={x} y={y + 4} fill="#fff" fontSize={10} textAnchor="middle" fontWeight="bold">
        📍
      </SvgText>
    </G>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
  },
  gridBackground: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  coordsOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  coordsText: {
    fontSize: 11,
    color: '#333',
    fontFamily: 'monospace',
  },
  webNotice: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  webNoticeText: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
});

export default MapView;
