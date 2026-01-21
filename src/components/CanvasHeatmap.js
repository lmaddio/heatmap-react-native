import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Defs, RadialGradient, Stop, G, Path } from 'react-native-svg';
import { geoToScreen, getGradientSpeedColor } from '../utils/heatmapUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * CanvasHeatmap - SVG-based custom heatmap visualization
 * This provides more control over the heatmap appearance compared to native map circles
 */
const CanvasHeatmap = ({
  dataPoints,
  region,
  width = SCREEN_WIDTH,
  height = 300,
  circleRadius = 30,
  showPath = true,
  showGradient = true,
}) => {
  // Convert geo coordinates to screen coordinates
  const screenPoints = useMemo(() => {
    if (!region) return [];
    
    return dataPoints.map((point) => {
      const screenCoords = geoToScreen(
        point.latitude,
        point.longitude,
        region,
        width,
        height
      );
      return {
        ...point,
        x: screenCoords.x,
        y: screenCoords.y,
      };
    });
  }, [dataPoints, region, width, height]);

  // Generate path string for connecting points
  const pathString = useMemo(() => {
    if (screenPoints.length < 2) return '';
    
    return screenPoints.reduce((acc, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `${acc} L ${point.x} ${point.y}`;
    }, '');
  }, [screenPoints]);

  // Generate gradient IDs
  const gradients = useMemo(() => {
    return screenPoints.map((point, index) => ({
      id: `gradient-${index}`,
      colors: getGradientColors(point.speed),
    }));
  }, [screenPoints]);

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          {showGradient &&
            gradients.map((gradient, index) => (
              <RadialGradient
                key={gradient.id}
                id={gradient.id}
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
              >
                <Stop offset="0%" stopColor={gradient.colors.inner} stopOpacity="0.8" />
                <Stop offset="50%" stopColor={gradient.colors.middle} stopOpacity="0.5" />
                <Stop offset="100%" stopColor={gradient.colors.outer} stopOpacity="0.1" />
              </RadialGradient>
            ))}
        </Defs>

        {/* Draw path connecting points */}
        {showPath && pathString && (
          <Path
            d={pathString}
            stroke="#007AFF"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5,5"
          />
        )}

        {/* Draw heatmap circles */}
        <G>
          {screenPoints.map((point, index) => (
            <React.Fragment key={point.id}>
              {/* Outer glow */}
              <Circle
                cx={point.x}
                cy={point.y}
                r={circleRadius * 1.5}
                fill={showGradient ? `url(#gradient-${index})` : point.color.replace('0.5', '0.2')}
              />
              {/* Inner circle */}
              <Circle
                cx={point.x}
                cy={point.y}
                r={circleRadius / 2}
                fill={point.color}
                stroke={point.color.replace('0.5', '0.8')}
                strokeWidth={1}
              />
            </React.Fragment>
          ))}
        </G>
      </Svg>
    </View>
  );
};

// Helper function to get gradient colors based on speed
const getGradientColors = (speed) => {
  if (speed >= 50) {
    return {
      inner: 'rgb(0, 255, 0)',
      middle: 'rgb(100, 255, 100)',
      outer: 'rgb(200, 255, 200)',
    };
  } else if (speed >= 25) {
    return {
      inner: 'rgb(144, 238, 144)',
      middle: 'rgb(180, 245, 180)',
      outer: 'rgb(220, 250, 220)',
    };
  } else if (speed >= 10) {
    return {
      inner: 'rgb(255, 255, 0)',
      middle: 'rgb(255, 255, 100)',
      outer: 'rgb(255, 255, 200)',
    };
  } else if (speed >= 5) {
    return {
      inner: 'rgb(255, 165, 0)',
      middle: 'rgb(255, 200, 100)',
      outer: 'rgb(255, 230, 180)',
    };
  } else {
    return {
      inner: 'rgb(255, 0, 0)',
      middle: 'rgb(255, 100, 100)',
      outer: 'rgb(255, 200, 200)',
    };
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});

export default CanvasHeatmap;
