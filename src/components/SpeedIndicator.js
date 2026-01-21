import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getSpeedColor, getSpeedLabel, getHeatmapGradient, MAX_SPEED } from '../utils/heatmapUtils';

/**
 * SpeedIndicator component - displays current network speed with gradient visualization
 */
const SpeedIndicator = ({
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
    <View style={styles.container}>
      {/* Gradient speed indicator circles */}
      <View style={styles.indicatorContainer}>
        <View style={[styles.indicatorOuter, { backgroundColor: gradient.outer }]}>
          <View style={[styles.indicatorMiddle, { backgroundColor: gradient.middle }]}>
            <View style={[styles.indicatorInner, { backgroundColor: gradient.inner }]}>
              {isTesting && (
                <View style={styles.testingOverlay}>
                  <Text style={styles.testingText}>...</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.speedValue}>
          {speed.toFixed(1)} <Text style={styles.unit}>Mbps</Text>
        </Text>
        
        <Text style={[styles.label, { color: gradient.inner }]}>{label}</Text>
        
        {/* Mini gradient bar with marker */}
        <View style={styles.gradientBarContainer}>
          <View style={styles.gradientBar}>
            {gradientColors.map((color, i) => (
              <View key={i} style={[styles.gradientSegment, { backgroundColor: color }]} />
            ))}
          </View>
          <View style={[styles.speedMarker, { left: `${markerPosition}%` }]} />
        </View>
        
        <View style={styles.connectionInfo}>
          <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#34C759' : '#FF3B30' }]} />
          <Text style={styles.connectionText}>
            {networkType.toUpperCase()}
            {cellularGeneration && ` (${cellularGeneration.toUpperCase()})`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  indicatorContainer: {
    marginRight: 15,
  },
  indicatorOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorMiddle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  testingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  speedValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  unit: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#666',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  gradientBarContainer: {
    marginTop: 8,
    marginBottom: 6,
    position: 'relative',
  },
  gradientBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  gradientSegment: {
    flex: 1,
    height: '100%',
  },
  speedMarker: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 10,
    backgroundColor: '#000',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#fff',
    marginLeft: -2,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: '#999',
  },
});

export default SpeedIndicator;
