import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ControlButtonsProps {
  isTracking: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onClearData: () => void;
  dataPointsCount: number;
}

/**
 * ControlButtons component - tracking controls
 */
const ControlButtons: React.FC<ControlButtonsProps> = ({
  isTracking,
  onStartTracking,
  onStopTracking,
  onClearData,
  dataPointsCount,
}) => {
  return (
    <View className="flex-row p-2.5 bg-white rounded-xl shadow-sm justify-around gap-2.5">
      <TouchableOpacity
        className={`flex-1 flex-row items-center justify-center py-3.5 px-5 rounded-xl gap-2 ${
          isTracking ? 'bg-danger' : 'bg-success'
        }`}
        onPress={isTracking ? onStopTracking : onStartTracking}
        activeOpacity={0.8}
      >
        <Text className="text-base">{isTracking ? '⏹' : '▶'}</Text>
        <Text className="text-white text-base font-semibold">
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={`flex-row items-center justify-center py-3.5 px-5 rounded-xl gap-2 bg-warning ${
          dataPointsCount === 0 ? 'opacity-50' : ''
        }`}
        style={{ flex: 0.5 }}
        onPress={onClearData}
        disabled={dataPointsCount === 0}
        activeOpacity={0.8}
      >
        <Text className="text-base">🗑</Text>
        <Text className="text-white text-base font-semibold">Clear</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ControlButtons;
