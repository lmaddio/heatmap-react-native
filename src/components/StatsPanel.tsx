import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { calculateStats, getSpeedColor, MAX_SPEED } from '../utils/heatmapUtils';
import type { DataPoint, HistogramBar } from '../types';

interface StatsPanelProps {
  dataPoints: DataPoint[];
}

/**
 * StatsPanel component - displays statistics with gradient visualization
 */
const StatsPanel: React.FC<StatsPanelProps> = ({ dataPoints }) => {
  const stats = calculateStats(dataPoints);

  // Calculate speed distribution for histogram
  const histogram: HistogramBar[] = useMemo(() => {
    if (dataPoints.length === 0) return [];
    
    const buckets = 10;
    const distribution = new Array<number>(buckets).fill(0);
    
    dataPoints.forEach(point => {
      const bucketIndex = Math.min(
        Math.floor((point.speed / MAX_SPEED) * buckets),
        buckets - 1
      );
      distribution[bucketIndex]++;
    });
    
    const maxCount = Math.max(...distribution, 1);
    return distribution.map((count, index) => ({
      count,
      height: (count / maxCount) * 100,
      speed: ((index + 0.5) / buckets) * MAX_SPEED,
      color: getSpeedColor(((index + 0.5) / buckets) * MAX_SPEED, 1),
    }));
  }, [dataPoints]);

  if (stats.count === 0) {
    return (
      <View className="bg-white p-4 rounded-xl shadow-sm">
        <Text className="text-sm text-gray-400 text-center italic">
          No data collected yet. Start tracking to collect network speed data.
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white p-4 rounded-xl shadow-sm">
      <Text className="text-base font-semibold text-gray-700 mb-3">Session Statistics</Text>
      
      <View className="flex-row flex-wrap mb-4">
        <View className="w-1/4 items-center">
          <Text className="text-xl font-bold">{stats.count}</Text>
          <Text className="text-xs text-gray-500 text-center">Data Points</Text>
        </View>
        
        <View className="w-1/4 items-center">
          <Text className="text-xl font-bold" style={{ color: getSpeedColor(stats.average, 1) }}>
            {stats.average.toFixed(1)}
          </Text>
          <Text className="text-xs text-gray-500 text-center">Avg Speed</Text>
        </View>
        
        <View className="w-1/4 items-center">
          <Text className="text-xl font-bold" style={{ color: getSpeedColor(stats.max, 1) }}>
            {stats.max.toFixed(1)}
          </Text>
          <Text className="text-xs text-gray-500 text-center">Max Speed</Text>
        </View>
        
        <View className="w-1/4 items-center">
          <Text className="text-xl font-bold" style={{ color: getSpeedColor(stats.min, 1) }}>
            {stats.min.toFixed(1)}
          </Text>
          <Text className="text-xs text-gray-500 text-center">Min Speed</Text>
        </View>
      </View>

      {/* Speed Distribution Histogram */}
      <View className="mb-4 pb-4 border-b border-neutral-200">
        <Text className="text-xs font-medium text-gray-500 mb-2">Speed Distribution</Text>
        <View className="flex-row h-16 items-end">
          {histogram.map((bar, index) => (
            <View key={index} className="flex-1 items-center">
              <View style={styles.histogramBarWrapper}>
                <View 
                  className="w-full rounded-sm"
                  style={{ 
                    height: `${Math.max(bar.height, 2)}%` as unknown as number,
                    backgroundColor: bar.color,
                    minHeight: 2,
                  }} 
                />
              </View>
              {index % 2 === 0 && (
                <Text className="text-xs text-gray-400 mt-0.5">
                  {Math.round(bar.speed)}
                </Text>
              )}
            </View>
          ))}
        </View>
        <Text className="text-xs text-gray-400 text-center mt-1">Speed (Mbps)</Text>
      </View>

      {/* Coverage breakdown with gradient */}
      <View>
        <Text className="text-xs font-medium text-gray-500 mb-2">Coverage Quality</Text>
        <View className="flex-row h-3.5 rounded-lg overflow-hidden bg-neutral-200">
          {stats.excellent > 0 && (
            <View
              style={[
                styles.breakdownSegment,
                { flex: stats.excellent, backgroundColor: getSpeedColor(75, 1) },
              ]}
            />
          )}
          {stats.good > 0 && (
            <View
              style={[
                styles.breakdownSegment,
                { flex: stats.good, backgroundColor: getSpeedColor(35, 1) },
              ]}
            />
          )}
          {stats.fair > 0 && (
            <View
              style={[
                styles.breakdownSegment,
                { flex: stats.fair, backgroundColor: getSpeedColor(15, 1) },
              ]}
            />
          )}
          {(stats.poor + stats.veryPoor) > 0 && (
            <View
              style={[
                styles.breakdownSegment,
                { flex: stats.poor + stats.veryPoor, backgroundColor: getSpeedColor(3, 1) },
              ]}
            />
          )}
        </View>
        <View className="flex-row flex-wrap justify-between mt-2">
          <View className="flex-row items-center w-1/2 mb-1">
            <View 
              className="w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: getSpeedColor(75, 1) }}
            />
            <Text className="text-xs text-gray-500">Excellent: {stats.excellent}</Text>
          </View>
          <View className="flex-row items-center w-1/2 mb-1">
            <View 
              className="w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: getSpeedColor(35, 1) }}
            />
            <Text className="text-xs text-gray-500">Good: {stats.good}</Text>
          </View>
          <View className="flex-row items-center w-1/2 mb-1">
            <View 
              className="w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: getSpeedColor(15, 1) }}
            />
            <Text className="text-xs text-gray-500">Fair: {stats.fair}</Text>
          </View>
          <View className="flex-row items-center w-1/2 mb-1">
            <View 
              className="w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: getSpeedColor(3, 1) }}
            />
            <Text className="text-xs text-gray-500">Poor: {stats.poor + stats.veryPoor}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Keep minimal styles for dynamic values
const styles = StyleSheet.create({
  histogramBarWrapper: {
    flex: 1,
    width: '80%',
    justifyContent: 'flex-end',
  },
  breakdownSegment: {
    height: '100%',
  },
});

export default StatsPanel;
