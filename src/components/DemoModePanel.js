import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

/**
 * Demo Mode Panel - Controls for mock location simulation (web only)
 */
const DemoModePanel = ({
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Demo Mode</Text>
        <Text style={styles.subtitle}>Simulated walking movement</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalDistance.toFixed(0)}m</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{simulatedSpeed.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Mbps</Text>
        </View>
        <View style={[styles.statusDot, isSimulating ? styles.statusActive : styles.statusInactive]} />
      </View>

      <View style={styles.buttonRow}>
        {!isSimulating ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={onStartSimulation}
          >
            <Text style={styles.buttonText}>▶ Start Walking</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={onStopSimulation}
          >
            <Text style={styles.buttonText}>⏸ Pause</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={onResetSimulation}
        >
          <Text style={styles.buttonText}>↺ Reset</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.infoText}>
        📍 Simulates GPS movement at ~1.4 m/s with varying network conditions
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 12,
    margin: 10,
    borderWidth: 1,
    borderColor: '#4a4a6a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 11,
    color: '#888',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4fc3f7',
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 10,
  },
  statusActive: {
    backgroundColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusInactive: {
    backgroundColor: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4caf50',
  },
  stopButton: {
    backgroundColor: '#ff9800',
  },
  resetButton: {
    backgroundColor: '#2196f3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default DemoModePanel;
