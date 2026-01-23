import React, { memo, useMemo } from 'react';
import { Platform } from 'react-native';
import { Circle, Polyline } from './MapComponents';
import { getHeatmapGradient } from '../utils/heatmapUtils';
import type { DataPoint, Coordinates, GradientDataPoint } from '../types';

interface HeatmapOverlayProps {
  dataPoints: DataPoint[];
  pathCoordinates: Coordinates[];
  showPath?: boolean;
  showGradientPath?: boolean;
  circleRadius?: number;
}

/**
 * HeatmapOverlay component - renders gradient heatmap circles and path on the map
 * Uses smooth color gradients to accurately represent network speed variations
 */
const HeatmapOverlay: React.FC<HeatmapOverlayProps> = memo(({ 
  dataPoints, 
  pathCoordinates, 
  showPath = true,
  showGradientPath = true,
  circleRadius = 25,
}) => {
  // Extract speeds for gradient path coloring
  const pathSpeeds: number[] = useMemo(() => {
    return dataPoints.map(point => point.speed);
  }, [dataPoints]);

  // Generate gradient colors for each point
  const gradientPoints: GradientDataPoint[] = useMemo(() => {
    return dataPoints.map((point, index) => {
      const gradient = getHeatmapGradient(point.speed);
      return {
        ...point,
        gradient,
        index,
      };
    });
  }, [dataPoints]);

  return (
    <>
      {/* Draw path line connecting all points */}
      {showPath && pathCoordinates.length > 1 && (
        <Polyline
          coordinates={pathCoordinates}
          strokeColor={showGradientPath ? undefined : "#007AFF"}
          strokeWidth={4}
          speeds={showGradientPath ? pathSpeeds : undefined}
        />
      )}

      {/* Draw heatmap circles with gradients at each data point */}
      {gradientPoints.map((point, index) => {
        // For native platforms, we render multiple circles for gradient effect
        if (Platform.OS !== 'web') {
          return (
            <React.Fragment key={point.id}>
              {/* Outer glow - very transparent */}
              <Circle
                center={{
                  latitude: point.latitude,
                  longitude: point.longitude,
                }}
                radius={circleRadius * 2}
                fillColor={point.gradient.outer}
                strokeColor="transparent"
                strokeWidth={0}
              />
              {/* Middle ring */}
              <Circle
                center={{
                  latitude: point.latitude,
                  longitude: point.longitude,
                }}
                radius={circleRadius * 1.3}
                fillColor={point.gradient.middle}
                strokeColor="transparent"
                strokeWidth={0}
              />
              {/* Inner circle - most opaque */}
              <Circle
                center={{
                  latitude: point.latitude,
                  longitude: point.longitude,
                }}
                radius={circleRadius * 0.6}
                fillColor={point.gradient.inner}
                strokeColor="#ffffff"
                strokeWidth={1}
              />
            </React.Fragment>
          );
        }
        
        // For web, use the gradient-enabled Circle component
        return (
          <Circle
            key={point.id}
            center={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            radius={circleRadius}
            speed={point.speed}
            _circleIndex={index}
          />
        );
      })}
    </>
  );
});

HeatmapOverlay.displayName = 'HeatmapOverlay';

export default HeatmapOverlay;
