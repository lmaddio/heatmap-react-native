import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
  TextInput,
} from 'react-native';

/**
 * SettingsModal component - app settings configuration
 */
const SettingsModal = ({ visible, onClose, settings, onSaveSettings }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const updateSetting = (key, value) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Tracking Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tracking</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Update Interval</Text>
                <Text style={styles.settingDescription}>
                  How often to record location (milliseconds)
                </Text>
              </View>
              <TextInput
                style={styles.numberInput}
                value={String(localSettings.trackingInterval)}
                onChangeText={(text) =>
                  updateSetting('trackingInterval', parseInt(text) || 3000)
                }
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Distance Interval</Text>
                <Text style={styles.settingDescription}>
                  Minimum distance to trigger update (meters)
                </Text>
              </View>
              <TextInput
                style={styles.numberInput}
                value={String(localSettings.distanceInterval)}
                onChangeText={(text) =>
                  updateSetting('distanceInterval', parseInt(text) || 5)
                }
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Network Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Network</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Speed Tests</Text>
                <Text style={styles.settingDescription}>
                  Perform actual network speed tests (slower, more accurate)
                </Text>
              </View>
              <Switch
                value={localSettings.enableSpeedTest}
                onValueChange={(value) => updateSetting('enableSpeedTest', value)}
                trackColor={{ false: '#E5E5E5', true: '#34C759' }}
              />
            </View>
          </View>

          {/* Display Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Display</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show Path Line</Text>
                <Text style={styles.settingDescription}>
                  Draw a line connecting tracked points
                </Text>
              </View>
              <Switch
                value={localSettings.showPath}
                onValueChange={(value) => updateSetting('showPath', value)}
                trackColor={{ false: '#E5E5E5', true: '#34C759' }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Circle Radius</Text>
                <Text style={styles.settingDescription}>
                  Size of heatmap circles (meters)
                </Text>
              </View>
              <TextInput
                style={styles.numberInput}
                value={String(localSettings.circleRadius)}
                onChangeText={(text) =>
                  updateSetting('circleRadius', parseInt(text) || 20)
                }
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Data Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-Save</Text>
                <Text style={styles.settingDescription}>
                  Automatically save data points to device storage
                </Text>
              </View>
              <Switch
                value={localSettings.autoSave}
                onValueChange={(value) => updateSetting('autoSave', value)}
                trackColor={{ false: '#E5E5E5', true: '#34C759' }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    paddingVertical: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  numberInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default SettingsModal;
