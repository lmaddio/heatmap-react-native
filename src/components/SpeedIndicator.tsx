import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getSpeedColor, getSpeedLabel, getHeatmapGradient, MAX_SPEED } from '../utils/heatmapUtils';
import type { CellularGeneration } from '../types';

interface SpeedIndicatorProps {
  speed: number;
  networkType: string;
  cellularGeneration?: CellularGeneration;
  isConnected: boolean;
  isTesting: boolean;
}

/**
 * SpeedIndicator component - displays current network speed with gradient visualization
 */
const SpeedIndicator: React.FC<SpeedIndicatorProps> = ({
  speed,
  networkType,
  cellularGeneration,
  isConnected,
  isTesting,
}) => {
  const label = getSpeedLabel(speed);
  const gradient = useMemo(() => getHeatmapGradient(speed), [speed]);

  // Generate gradient bar colors
  const gradientColors = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => getSpeedColor((i / 19) * MAX_SPEED, 1));
  }, []);

  // Calculate marker position (0-100%)
  const markerPosition = Math.min((speed / MAX_SPEED) * 100, 100);

  return (
    <View className="flex-row items-center bg-white p-4 rounded-xl shadow-md">
      {/* Gradient speed indicator circles */}
      <View className="mr-4">
        <View 
          className="w-20 h-20 rounded-full justify-center items-center"
          style={{ backgroundColor: gradient.outer }}
        >
          <View 
            className="w-14 h-14 rounded-full justify-center items-center"
            style={{ backgroundColor: gradient.middle }}
          >
            <View 
              className="w-9 h-9 rounded-full border-2 border-white/80 justify-center items-center"
              style={{ backgroundColor: gradient.inner }}
            >
              {isTesting && (
                <View className="justify-center items-center">
                  <Text className="text-white text-sm font-bold">...</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
      
      <View className="flex-1">
        <Text className="text-3xl font-bold text-black">
          {speed.toFixed(1)} <Text className="text-base font-normal text-gray-500">Mbps</Text>
        </Text>
        
        <Text className="text-lg font-semibold mt-0.5" style={{ color: gradient.inner }}>
          {label}
        </Text>
        
        {/* Mini gradient bar with marker */}
        <View className="mt-2 mb-1.5 relative">
          <View className="flex-row h-1.5 rounded-sm overflow-hidden">
            {gradientColors.map((color, i) => (
              <View key={i} style={[styles.gradientSegment, { backgroundColor: color }]} />
            ))}
          </View>
          <View 
            className="absolute -top-0.5 w-1 h-2.5 bg-black rounded-sm border border-white -ml-0.5"
            style={{ left: `${markerPosition}%` as unknown as number }}
          />
        </View>
        
        <View className="flex-row items-center mt-1">
          <View 
            className={`w-2 h-2 rounded-full mr-1.5 ${isConnected ? 'bg-success' : 'bg-danger'}`}
          />
          <Text className="text-xs text-gray-400">
            {networkType.toUpperCase()}
            {cellularGeneration && ` (${cellularGeneration.toUpperCase()})`}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Keep minimal styles for dynamic values
const styles = StyleSheet.create({
  gradientSegment: {
    flex: 1,
    height: '100%',
  },
});

export default SpeedIndicator;
