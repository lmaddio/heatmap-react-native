import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';

interface DemoModePanelProps {
  isSimulating: boolean;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onResetSimulation: () => void;
  totalDistance: number;
  simulatedSpeed: number;
  visible?: boolean;
}

/**
 * Demo Mode Panel - Controls for mock location simulation (web only)
 */
const DemoModePanel: React.FC<DemoModePanelProps> = ({
  isSimulating,
  onStartSimulation,
  onStopSimulation,
  onResetSimulation,
  totalDistance,
  simulatedSpeed,
  visible = true,
}) => {
  // Only show on web platform
  if (Platform.OS !== 'web' || !visible) {
    return null;
  }

  return (
    <View className="bg-panel-bg p-3 rounded-xl m-2.5 border border-panel-border">
      <View className="flex-row justify-between items-center mb-2.5">
        <Text className="text-base font-bold text-white">🧪 Demo Mode</Text>
        <Text className="text-xs text-gray-500">Simulated walking movement</Text>
      </View>

      <View className="flex-row items-center mb-2.5 pb-2.5 border-b border-gray-700">
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-cyan-400">{totalDistance.toFixed(0)}m</Text>
          <Text className="text-xs text-gray-500">Distance</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-cyan-400">{simulatedSpeed.toFixed(1)}</Text>
          <Text className="text-xs text-gray-500">Mbps</Text>
        </View>
        <View 
          className={`w-3 h-3 rounded-full ml-2.5 ${
            isSimulating ? 'bg-green-500' : 'bg-gray-500'
          }`}
        />
      </View>

      <View className="flex-row gap-2">
        {!isSimulating ? (
          <TouchableOpacity
            className="flex-1 py-2.5 px-4 rounded-lg items-center bg-green-500"
            onPress={onStartSimulation}
          >
            <Text className="text-white text-sm font-semibold">▶ Start Walking</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="flex-1 py-2.5 px-4 rounded-lg items-center bg-orange-500"
            onPress={onStopSimulation}
          >
            <Text className="text-white text-sm font-semibold">⏸ Pause</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          className="flex-1 py-2.5 px-4 rounded-lg items-center bg-blue-500"
          onPress={onResetSimulation}
        >
          <Text className="text-white text-sm font-semibold">↺ Reset</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-xs text-gray-600 text-center mt-2.5">
        📍 Simulates GPS movement at ~1.4 m/s with varying network conditions
      </Text>
    </View>
  );
};

export default DemoModePanel;
