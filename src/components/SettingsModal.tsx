import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
  TextInput,
} from 'react-native';
import type { AppSettings } from '../types';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

/**
 * SettingsModal component - app settings configuration
 */
const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = (): void => {
    onSaveSettings(localSettings);
    onClose();
  };

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): void => {
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
      <View className="flex-1 bg-neutral-100">
        <View className="flex-row justify-between items-center p-4 bg-white border-b border-neutral-200">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-base text-primary">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-black">Settings</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text className="text-base text-primary font-semibold">Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {/* Tracking Settings */}
          <View className="bg-white mt-5 px-4">
            <Text className="text-sm font-semibold text-gray-500 uppercase py-3">
              Tracking
            </Text>

            <View className="flex-row justify-between items-center py-3 border-b border-neutral-200">
              <View className="flex-1 mr-4">
                <Text className="text-base text-black">Update Interval</Text>
                <Text className="text-xs text-gray-400 mt-0.5">
                  How often to record location (milliseconds)
                </Text>
              </View>
              <TextInput
                className="w-20 h-10 border border-neutral-200 rounded-lg px-3 text-center text-base"
                value={String(localSettings.trackingInterval)}
                onChangeText={(text) =>
                  updateSetting('trackingInterval', parseInt(text, 10) || 3000)
                }
                keyboardType="number-pad"
              />
            </View>

            <View className="flex-row justify-between items-center py-3 border-b border-neutral-200">
              <View className="flex-1 mr-4">
                <Text className="text-base text-black">Distance Interval</Text>
                <Text className="text-xs text-gray-400 mt-0.5">
                  Minimum distance to trigger update (meters)
                </Text>
              </View>
              <TextInput
                className="w-20 h-10 border border-neutral-200 rounded-lg px-3 text-center text-base"
                value={String(localSettings.distanceInterval)}
                onChangeText={(text) =>
                  updateSetting('distanceInterval', parseInt(text, 10) || 5)
                }
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Network Settings */}
          <View className="bg-white mt-5 px-4">
            <Text className="text-sm font-semibold text-gray-500 uppercase py-3">
              Network
            </Text>

            <View className="flex-row justify-between items-center py-3 border-b border-neutral-200">
              <View className="flex-1 mr-4">
                <Text className="text-base text-black">Enable Speed Tests</Text>
                <Text className="text-xs text-gray-400 mt-0.5">
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
          <View className="bg-white mt-5 px-4">
            <Text className="text-sm font-semibold text-gray-500 uppercase py-3">
              Display
            </Text>

            <View className="flex-row justify-between items-center py-3 border-b border-neutral-200">
              <View className="flex-1 mr-4">
                <Text className="text-base text-black">Show Path Line</Text>
                <Text className="text-xs text-gray-400 mt-0.5">
                  Draw a line connecting tracked points
                </Text>
              </View>
              <Switch
                value={localSettings.showPath}
                onValueChange={(value) => updateSetting('showPath', value)}
                trackColor={{ false: '#E5E5E5', true: '#34C759' }}
              />
            </View>

            <View className="flex-row justify-between items-center py-3 border-b border-neutral-200">
              <View className="flex-1 mr-4">
                <Text className="text-base text-black">Circle Radius</Text>
                <Text className="text-xs text-gray-400 mt-0.5">
                  Size of heatmap circles (meters)
                </Text>
              </View>
              <TextInput
                className="w-20 h-10 border border-neutral-200 rounded-lg px-3 text-center text-base"
                value={String(localSettings.circleRadius)}
                onChangeText={(text) =>
                  updateSetting('circleRadius', parseInt(text, 10) || 20)
                }
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Data Settings */}
          <View className="bg-white mt-5 px-4">
            <Text className="text-sm font-semibold text-gray-500 uppercase py-3">
              Data
            </Text>

            <View className="flex-row justify-between items-center py-3 border-b border-neutral-200">
              <View className="flex-1 mr-4">
                <Text className="text-base text-black">Auto-Save</Text>
                <Text className="text-xs text-gray-400 mt-0.5">
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

export default SettingsModal;
