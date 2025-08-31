# HandHUD Component

A React component that provides hand tracking and gesture recognition using MediaPipe Hands API.

## Features

- **Real-time Hand Tracking**: Uses MediaPipe to detect and track hand movements
- **Gesture Recognition**: Identifies common hand gestures like pinch, point, and open palm
- **Interactive Canvas**: Displays camera feed with hand landmarks and particle effects
- **Responsive Design**: Works on both desktop and mobile devices
- **Performance Monitoring**: Shows FPS and tracking status
- **Customizable Speed**: Adjustable particle effect speed

## Usage

The HandHUD component is integrated into the Home page and can be accessed via the "Hand HUD" button in the top navigation.

```jsx
import HandHUD from '../HandHUD/HandHUD';

// In your component
<HandHUD
  isOpen={showHandHUD}
  onClose={() => setShowHandHUD(false)}
/>
```

## Controls

- **Enable Camera**: Starts the camera and hand tracking
- **Stop Camera**: Stops the camera and tracking
- **Speed Selector**: Adjusts particle effect speed (0.6x to 3x)
- **Status Display**: Shows current tracking status
- **Gesture Display**: Shows detected hand gesture
- **FPS Counter**: Displays current frame rate

## Gestures Recognized

- **Pinch**: Thumb and index finger close together
- **Point**: Only index finger extended
- **Open Palm**: 4 or more fingers extended
- **Unknown**: Gesture doesn't match known patterns

## Technical Details

- Built with React 18 and modern hooks
- Uses MediaPipe Hands API for hand detection
- Canvas-based rendering for performance
- Responsive design with mobile-first approach
- Automatic cleanup of resources

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Requirements

- Camera access permission
- Modern browser with WebGL support
- Stable internet connection for MediaPipe CDN

## Troubleshooting

1. **Camera not working**: Ensure camera permissions are granted
2. **Hand detection issues**: Check lighting conditions and hand positioning
3. **Performance issues**: Try reducing speed setting or close other browser tabs
4. **Script loading errors**: Check internet connection and try refreshing the page
