import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * ControlButtons component - tracking controls
 */
const ControlButtons = ({
  isTracking,
  onStartTracking,
  onStopTracking,
  onClearData,
  dataPointsCount,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isTracking ? styles.stopButton : styles.startButton]}
        onPress={isTracking ? onStopTracking : onStartTracking}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonIcon}>{isTracking ? '⏹' : '▶'}</Text>
        <Text style={styles.buttonText}>
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.clearButton, dataPointsCount === 0 && styles.disabledButton]}
        onPress={onClearData}
        disabled={dataPointsCount === 0}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonIcon}>🗑</Text>
        <Text style={styles.buttonText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'space-around',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  clearButton: {
    backgroundColor: '#FF9500',
    flex: 0.5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonIcon: {
    fontSize: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ControlButtons;
