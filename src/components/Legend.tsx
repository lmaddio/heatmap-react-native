import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getSpeedColor, MAX_SPEED } from '../utils/heatmapUtils';
import type { SpeedMarker } from '../types';

interface LegendProps {
  collapsed?: boolean;
}

/**
 * Legend component - shows smooth gradient speed legend
 */
const Legend: React.FC<LegendProps> = ({ collapsed = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  // Generate gradient colors for the legend bar
  const gradientColors = useMemo((): string[] => {
    const colors: string[] = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const speed = (i / steps) * MAX_SPEED;
      colors.push(getSpeedColor(speed, 1));
    }
    return colors;
  }, []);

  // Speed markers for the legend
  const speedMarkers: SpeedMarker[] = [
    { speed: 0, label: '0' },
    { speed: 10, label: '10' },
    { speed: 25, label: '25' },
    { speed: 50, label: '50' },
    { speed: 100, label: '100' },
  ];

  return (
    <View className="bg-white rounded-xl shadow-sm overflow-hidden">
      <TouchableOpacity
        className="flex-row justify-between items-center p-3"
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}
      >
        <Text className="text-sm font-semibold text-gray-700">Network Speed (Mbps)</Text>
        <Text className="text-xs text-gray-500">{isCollapsed ? '▼' : '▲'}</Text>
      </TouchableOpacity>

      {!isCollapsed && (
        <View className="px-4 pb-4">
          {/* Gradient bar */}
          <View className="mb-3">
            <View className="flex-row h-5 rounded-lg overflow-hidden border border-black/10">
              {gradientColors.map((color, index) => (
                <View
                  key={index}
                  style={[
                    styles.gradientSegment,
                    { 
                      backgroundColor: color,
                      width: `${100 / gradientColors.length}%` as unknown as number,
                    },
                  ]}
                />
              ))}
            </View>
            
            {/* Speed markers */}
            <View className="relative h-6 mt-1">
              {speedMarkers.map((marker, index) => (
                <View 
                  key={index} 
                  className="absolute items-center"
                  style={{ 
                    left: `${(marker.speed / MAX_SPEED) * 100}%` as unknown as number,
                    transform: [{ translateX: -10 }],
                  }}
                >
                  <View className="w-px h-1.5 bg-gray-400" />
                  <Text className="text-xs text-gray-500 mt-0.5">{marker.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Speed quality labels */}
          <View className="flex-row justify-between mt-2 px-1">
            <View className="flex-row items-center">
              <View 
                className="w-2.5 h-2.5 rounded-full mr-1 border border-black/10"
                style={{ backgroundColor: getSpeedColor(0, 1) }}
              />
              <Text className="text-xs text-gray-500">Poor</Text>
            </View>
            <View className="flex-row items-center">
              <View 
                className="w-2.5 h-2.5 rounded-full mr-1 border border-black/10"
                style={{ backgroundColor: getSpeedColor(15, 1) }}
              />
              <Text className="text-xs text-gray-500">Fair</Text>
            </View>
            <View className="flex-row items-center">
              <View 
                className="w-2.5 h-2.5 rounded-full mr-1 border border-black/10"
                style={{ backgroundColor: getSpeedColor(35, 1) }}
              />
              <Text className="text-xs text-gray-500">Good</Text>
            </View>
            <View className="flex-row items-center">
              <View 
                className="w-2.5 h-2.5 rounded-full mr-1 border border-black/10"
                style={{ backgroundColor: getSpeedColor(75, 1) }}
              />
              <Text className="text-xs text-gray-500">Excellent</Text>
            </View>
          </View>

          {/* Info text */}
          <Text className="text-xs text-gray-400 text-center mt-3 italic">
            Colors represent real-time network speed at each location
          </Text>
        </View>
      )}
    </View>
  );
};

// Keep minimal styles for dynamic values that can't be expressed in Tailwind
const styles = StyleSheet.create({
  gradientSegment: {
    height: '100%',
  },
});

export default Legend;
