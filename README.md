# Network Speed Heatmap - React Native

A React Native application that tracks your location and displays a real-time heatmap visualization of network speed quality at different locations.

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020)
![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![NativeWind](https://img.shields.io/badge/NativeWind-Tailwind%20CSS-38bdf8)

## Features

- 📍 **Real-time Location Tracking**: Continuously tracks your position using GPS
- 📶 **Network Speed Measurement**: Estimates network speed based on connection type (WiFi, 4G, 5G, etc.)
- 🗺️ **Interactive Map**: Displays your path on an interactive map with heatmap overlay
- 🎨 **Smooth Gradient Heatmap**: Visual representation using continuous color gradients:
  - Uses logarithmic color scaling for better accuracy at lower speeds
  - Smooth transitions from dark red (0 Mbps) → red → orange → yellow → green (100+ Mbps)
  - Multi-layer radial gradients for each data point
  - Path lines colored by speed at each segment
- 📊 **Statistics Panel**: View session statistics including average speed, min/max values
- 📱 **Cross-platform**: Works on iOS and Android

## Screenshots

The app displays:
1. A map showing your tracked path
2. Colored circles at each location representing network speed
3. Current speed indicator with connection type
4. Statistics about your session

## Installation

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd heatmap-react-native
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
expo start
```

4. Run on your device:
- **iOS**: Press `i` to open in iOS Simulator or scan QR code with Expo Go
- **Android**: Press `a` to open in Android Emulator or scan QR code with Expo Go

## Project Structure

```
heatmap-react-native/
├── App.tsx                     # Main application entry point
├── app.json                    # Expo configuration
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── babel.config.js             # Babel configuration (with NativeWind)
├── nativewind-env.d.ts         # NativeWind TypeScript types
├── assets/                     # App icons and splash screen
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon.png
│   └── favicon.png
└── src/
    ├── App.tsx                 # Alternative modular App implementation
    ├── global.css              # Tailwind CSS directives
    ├── types/
    │   └── index.ts            # Shared type definitions
    ├── components/
    │   ├── index.ts            # Component exports
    │   ├── HeatmapOverlay.tsx  # Map heatmap circles component
    │   ├── SpeedIndicator.tsx  # Current speed display
    │   ├── ControlButtons.tsx  # Start/Stop tracking buttons
    │   ├── Legend.tsx          # Color legend component
    │   ├── StatsPanel.tsx      # Statistics display
    │   ├── DemoModePanel.tsx   # Demo mode controls (web only)
    │   ├── CanvasHeatmap.tsx   # SVG-based canvas heatmap
    │   ├── SettingsModal.tsx   # Settings modal component
    │   ├── MapComponents.tsx   # Platform map wrapper
    │   ├── MapComponents.web.tsx    # Web SVG-based map
    │   └── MapComponents.native.tsx # Native react-native-maps
    ├── hooks/
    │   ├── index.ts            # Hook exports
    │   ├── useLocation.ts      # Location tracking hook
    │   ├── useNetworkSpeed.ts  # Network speed monitoring hook
    │   └── useMockLocation.ts  # Mock location for web demo
    └── utils/
        ├── index.ts            # Utility exports
        ├── heatmapUtils.ts     # Utility functions for heatmap
        └── storage.ts          # Data persistence utilities
```

## Usage

1. **Start the App**: Launch the application on your device
2. **Grant Permissions**: Allow location access when prompted
3. **Start Tracking**: Tap "Start Tracking" to begin recording your path
4. **Move Around**: Walk or drive to different locations
5. **View Heatmap**: Watch the map populate with color-coded circles showing network quality
6. **Stop Tracking**: Tap "Stop Tracking" when finished
7. **View Statistics**: Check session statistics in the stats panel
8. **Clear Data**: Use "Clear Data" to reset and start a new session

## Demo Mode (Web Only)

The web version includes a **Demo Mode** that simulates GPS walking movement for testing without requiring actual location access.

### Features:
- 🚶 Simulates walking at ~1.4 m/s (average human walking speed)
- 📍 Random direction changes to simulate natural movement
- 📶 Simulated network speed variations based on location
- 🔴 Includes "poor signal zones" to demonstrate speed changes
- ⏸ Start/Pause/Reset controls

### How to Use:
1. Run `npm run web` to start the web version
2. Demo Mode activates automatically on web
3. Click "▶ Start Demo" to begin simulated walking
4. Watch the heatmap populate with data points
5. Use "⏸ Pause" to stop and "↺ Reset" to clear

### Demo Mode Configuration:
You can customize the simulation in `src/hooks/useMockLocation.ts`:

```typescript
const MOCK_CONFIG: MockConfig = {
  // Starting location (San Francisco by default)
  defaultLocation: {
    latitude: 37.7749,
    longitude: -122.4194,
  },
  // Movement settings
  walkingSpeedMps: 1.4,      // meters per second
  updateIntervalMs: 1000,    // update every second
  directionChangeChance: 0.1, // 10% chance to turn
  
  // Network simulation
  networkSpeedBase: 35,      // Base speed in Mbps
  networkSpeedVariation: 40, // Random variation
  
  // Poor signal zones (for realistic simulation)
  poorSignalZones: [
    { lat: 37.7760, lng: -122.4180, radius: 0.001, speedFactor: 0.2 },
  ],
};
```

### NPM Scripts:
```bash
npm run web         # Start web with demo mode
npm run build:web   # Build for production
npm run serve:web   # Serve built web app locally
npm run typecheck   # Run TypeScript type checking
npm run ts:check    # Alias for typecheck
```

## Configuration

### Tailwind CSS (NativeWind)

This project uses [NativeWind](https://www.nativewind.dev/) to enable Tailwind CSS styling in React Native. The setup includes:

**tailwind.config.js** - Custom theme extensions:
```javascript
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],  // Required for NativeWind v4
  theme: {
    extend: {
      colors: {
        'speed-excellent': '#00c800',
        'speed-good': '#7cfc00',
        'speed-fair': '#ffff00',
        'speed-poor': '#ffa500',
        'speed-very-poor': '#ff0000',
        'primary': '#007AFF',
        'success': '#34C759',
        'danger': '#FF3B30',
        'warning': '#FF9500',
        'demo': '#4caf50',
      },
    },
  },
};
```

**Usage in components:**
```tsx
// Using Tailwind classes with className prop
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-bold text-gray-900">Hello World</Text>
</View>

// Dynamic classes with template literals
<TouchableOpacity className={`flex-1 py-3 rounded-xl ${isActive ? 'bg-success' : 'bg-danger'}`}>
```

**For dynamic color values** (like speed-based colors), use inline styles:
```tsx
<View style={{ backgroundColor: getSpeedColor(speed, 1) }} />
```

### Network Speed Visualization

The app uses smooth gradient colors based on speed. Customize the gradient stops in `src/utils/heatmapUtils.ts`:

```typescript
// Maximum speed for normalization
export const MAX_SPEED = 100;

// Gradient color stops - customize colors for different speed ranges
export const GRADIENT_STOPS: GradientStop[] = [
  { pos: 0.00, color: { r: 139, g: 0, b: 0 } },      // Dark Red - No signal
  { pos: 0.15, color: { r: 255, g: 69, b: 0 } },     // Orange-Red
  { pos: 0.35, color: { r: 255, g: 165, b: 0 } },    // Orange
  { pos: 0.55, color: { r: 255, g: 255, b: 0 } },    // Yellow
  { pos: 0.75, color: { r: 124, g: 252, b: 0 } },    // Lawn Green
  { pos: 1.00, color: { r: 0, g: 180, b: 0 } },      // Dark Green
];
```

The color system uses a combination of linear and logarithmic scaling to provide better resolution at lower speeds where connection quality differences are most noticeable.

### Location Update Frequency

Adjust in `App.tsx` or when using the `useLocation` hook:

```typescript
const { startTracking } = useLocation({
  timeInterval: 3000,    // Update every 3 seconds
  distanceInterval: 5,   // Or when moved 5 meters
});
```

### Enable Real Speed Tests

By default, the app estimates speed based on connection type. To enable actual speed tests:

```typescript
const { speed } = useNetworkSpeed({
  enableSpeedTest: true,
  testInterval: 30000, // Test every 30 seconds
});
```

## API Reference

### useLocation Hook

```typescript
const {
  location,           // Current location object (AppLocationObject | null)
  error,              // Error message if any (string | null)
  isTracking,         // Whether tracking is active (boolean)
  hasPermission,      // Whether location permission is granted (boolean)
  startTracking,      // Function to start tracking (() => Promise<boolean>)
  stopTracking,       // Function to stop tracking (() => void)
  getCurrentLocation, // Get location once (() => Promise<AppLocationObject | null>)
} = useLocation(options: UseLocationOptions);
```

### useNetworkSpeed Hook

```typescript
const {
  speed,              // Current speed in Mbps (number)
  networkType,        // 'wifi', 'cellular', etc. (NetworkType)
  isConnected,        // Whether device is online (boolean)
  cellularGeneration, // '4g', '5g', etc. (CellularGeneration)
  measureSpeed,       // Function to measure speed ((doSpeedTest?: boolean) => Promise<number>)
} = useNetworkSpeed(options: UseNetworkSpeedOptions);
```

### Utility Functions

```typescript
import {
  getSpeedColor,        // Get color for speed value
  getSpeedLabel,        // Get label ('Excellent', 'Good', etc.)
  calculateDistance,    // Calculate distance between coordinates
  createDataPoint,      // Create a data point object
  calculateStats,       // Calculate statistics from data points
} from './src/utils/heatmapUtils';
```

### Types

All shared types are defined in `src/types/index.ts`:

```typescript
import type {
  DataPoint,
  Coordinates,
  MapRegion,
  NetworkType,
  CellularGeneration,
  AppSettings,
  HeatmapGradient,
  // ... and more
} from './src/types';
```

## Dependencies

- **expo**: Expo SDK framework
- **expo-location**: Location services
- **expo-status-bar**: Status bar component
- **react-native-maps**: Map component
- **react-native-svg**: SVG rendering for custom graphics
- **@react-native-community/netinfo**: Network information
- **typescript**: TypeScript language support
- **@types/react**: React type definitions
- **@types/react-native**: React Native type definitions
- **nativewind**: Tailwind CSS for React Native
- **tailwindcss**: Utility-first CSS framework

## Permissions

### iOS (Info.plist)
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`

### Android (AndroidManifest.xml)
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`
- `ACCESS_NETWORK_STATE`
- `INTERNET`

## Troubleshooting

### Location not updating
- Ensure location permissions are granted
- Check that GPS is enabled on your device
- Try moving to a location with better GPS signal

### Network speed always shows 0
- Check that you have an active network connection
- Ensure the app has network permissions

### Map not displaying
- Verify internet connection
- On Android, ensure Google Play Services are installed

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [Expo](https://expo.dev/)
- Maps powered by [react-native-maps](https://github.com/react-native-maps/react-native-maps)
- Network info from [@react-native-community/netinfo](https://github.com/react-native-netinfo/react-native-netinfo)