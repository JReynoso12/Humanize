# Human Movement Heatmap Detection

A browser-based web application that detects human movement from a standard webcam and displays a simulated heat signature overlay using Next.js, React, and MediaPipe Pose.

## Features

- **Real-time Pose Detection**: Uses MediaPipe Pose to detect 33 body landmarks
- **Movement Tracking**: Calculates movement intensity frame-by-frame
- **Heatmap Visualization**: Converts movement to color gradients (blue/green → yellow → red)
- **Interactive Controls**: Toggle webcam, skeleton view, heatmap, and adjust sensitivity/decay
- **Client-Side Only**: All processing happens in the browser (no backend required)
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A webcam connected to your device
- Modern browser with WebRTC support (Chrome, Edge, Firefox, Safari)

## Installation

1. Clone or download this repository

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

## Running the Application

1. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

2. Open your browser and navigate to `http://localhost:3000`

3. Click "Start Webcam" to begin detection

4. Allow camera permissions when prompted

## Usage

### Controls

- **Start Webcam / Stop Webcam**: Toggle webcam feed
- **Skeleton View**: Toggle display of pose skeleton overlay
- **Heatmap View**: Toggle heatmap visualization
- **Motion Sensitivity**: Adjust how sensitive movement detection is (0-100%)
  - Lower values = less sensitive (requires more movement)
  - Higher values = more sensitive (detects smaller movements)
- **Heat Decay Rate**: Control how quickly heat fades (0-100%)
  - Lower values = slower decay (heat persists longer)
  - Higher values = faster decay (heat fades quickly)

### Understanding the Heatmap

- **Blue/Green**: Low movement intensity
- **Yellow**: Medium movement intensity
- **Red**: High movement intensity

The heatmap shows movement as radial gradients around detected body parts. Heat accumulates as you move and gradually decays over time.

## Project Structure

```
Humanize/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles
├── components/
│   ├── WebcamCapture.tsx   # Webcam access component
│   ├── PoseDetector.tsx    # MediaPipe Pose integration
│   ├── MotionAnalyzer.tsx  # Movement calculation
│   ├── HeatmapRenderer.tsx # Canvas heatmap renderer
│   └── Controls.tsx        # UI controls
├── hooks/
│   ├── useWebcam.ts        # Webcam stream management
│   └── usePoseDetection.ts # Pose detection hook
├── utils/
│   ├── motionUtils.ts      # Movement calculation utilities
│   └── heatmapUtils.ts     # Heatmap color & decay utilities
└── types/
    └── index.ts            # TypeScript type definitions
```

## Technologies Used

- **Next.js 14** (App Router) - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **MediaPipe Pose** - Pose detection ML model
- **Tailwind CSS** - Styling
- **WebRTC** - Webcam access

## Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support (may require HTTPS in production)

## Performance Tips

- Close other applications using the webcam
- Ensure good lighting for better pose detection
- Lower video resolution if experiencing performance issues
- Use Chrome/Edge for best MediaPipe performance

## Important Notes

⚠️ **This application provides a SIMULATED heatmap visualization, not real thermal or infrared data.** The colors represent movement intensity calculated from pose landmarks, not actual temperature.

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Troubleshooting

### Camera Not Working

- Ensure camera permissions are granted
- Check if another application is using the camera
- Try refreshing the page
- Verify camera is connected and working in other applications

### Pose Detection Not Working

- Ensure you're visible in the camera frame
- Check lighting conditions (better lighting = better detection)
- Make sure you're facing the camera
- Try adjusting motion sensitivity

### Performance Issues

- Lower the video resolution in `useWebcam.ts`
- Reduce model complexity in `PoseDetector.tsx` (change `modelComplexity` to 0)
- Close other browser tabs
- Use a more powerful device

## License

This project is open source and available for educational purposes.

## Acknowledgments

- MediaPipe by Google for pose detection technology
- Next.js team for the excellent framework
- React team for the UI library
