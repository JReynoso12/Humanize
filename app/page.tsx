'use client';

/**
 * Main Page Component
 * Integrates all components for human movement heatmap detection
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { WebcamCapture } from '@/components/WebcamCapture';
import { PoseDetector } from '@/components/PoseDetector';
import { MotionAnalyzer } from '@/components/MotionAnalyzer';
import { HeatmapRenderer, HeatmapRendererHandle } from '@/components/HeatmapRenderer';
import { PlasmaBall } from '@/components/PlasmaBall';
import { Controls } from '@/components/Controls';
import { AppState, MovementData, PoseLandmark } from '@/types';
import { useWebcam } from '@/hooks/useWebcam';
import { detectRaisedHands } from '@/utils/gestureUtils';
import type { PlasmaBallColor } from '@/components/PlasmaBall';

export default function Home() {
  const [appState, setAppState] = useState<AppState>({
    webcamEnabled: false,
    skeletonViewEnabled: false,
    heatmapEnabled: true,
    nightVisionEnabled: false,
    sensitivity: 50,
    decayRate: 10,
  });

  const [landmarks, setLandmarks] = useState<PoseLandmark[] | null>(null);
  const [movementData, setMovementData] = useState<MovementData | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [plasmaBalls, setPlasmaBalls] = useState<Array<{ id: string; x: number; y: number; rotation: number; createdAt: number; opacity: number; color: PlasmaBallColor }>>([]);
  const [rotation, setRotation] = useState(0);

  const { videoRef, stream, isActive, error, facingMode, startWebcam, stopWebcam, switchCamera } = useWebcam();
  const heatmapRendererRef = useRef<HeatmapRendererHandle>(null);
  const plasmaBallIdCounter = useRef(0);

  const handleStartWebcam = useCallback(async () => {
    await startWebcam();
    setAppState((prev) => ({ ...prev, webcamEnabled: true }));
  }, [startWebcam]);

  const handleStopWebcam = useCallback(() => {
    stopWebcam();
    setAppState((prev) => ({ ...prev, webcamEnabled: false }));
    setLandmarks(null);
    setMovementData(null);
    setIsDetecting(false);
    setVideoElement(null);
    heatmapRendererRef.current?.clear();
  }, [stopWebcam]);

  const handleStateChange = useCallback((updates: Partial<AppState>) => {
    setAppState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleVideoReady = useCallback((element: HTMLVideoElement | null) => {
    setVideoElement(element);
  }, []);

  const handleLandmarksDetected = useCallback((detectedLandmarks: PoseLandmark[] | null) => {
    setLandmarks(detectedLandmarks);
  }, []);

  const handleDetectionStateChange = useCallback((detecting: boolean) => {
    setIsDetecting(detecting);
  }, []);

  const handleMovementCalculated = useCallback((data: MovementData | null) => {
    setMovementData(data);
  }, []);

  // Detect raised hands and create plasma balls
  useEffect(() => {
    if (!landmarks || landmarks.length === 0) {
      // Clear all plasma balls when no landmarks detected
      setPlasmaBalls([]);
      return;
    }

    const hands = detectRaisedHands(landmarks);
    const threshold = 0.08; // Normalized distance threshold for updating existing balls

    // Use functional updates to avoid dependency on plasmaBalls
    setPlasmaBalls((prev) => {
      // Handle merged hands (hands together)
      if (hands.handsTogether && hands.mergedPosition) {
        // Check if we already have a merged ball
        const existingMergedBall = prev.find((ball) => ball.color === 'merged');
        
        if (existingMergedBall) {
          // Update position of existing merged ball
          return prev.map((ball) =>
            ball.id === existingMergedBall.id
              ? { ...ball, x: hands.mergedPosition!.x, y: hands.mergedPosition!.y }
              : ball
          );
        } else {
          // Remove any individual hand balls and create merged ball
          const filtered = prev.filter((ball) => ball.color !== 'blue' && ball.color !== 'red');
          const newMergedBall = {
            id: `plasma-merged-${plasmaBallIdCounter.current++}`,
            x: hands.mergedPosition.x,
            y: hands.mergedPosition.y,
            rotation: 0,
            createdAt: Date.now(),
            opacity: 1,
            color: 'merged' as PlasmaBallColor,
          };
          
          // Auto-remove merged ball after 5 seconds
          const fadeStart = 4000;
          const fadeDuration = 1000;
          
          setTimeout(() => {
            setPlasmaBalls((p) =>
              p.map((ball) =>
                ball.id === newMergedBall.id ? { ...ball, opacity: 0.5 } : ball
              )
            );
          }, fadeStart);

          setTimeout(() => {
            setPlasmaBalls((p) => p.filter((ball) => ball.id !== newMergedBall.id));
          }, fadeStart + fadeDuration);
          
          return [...filtered, newMergedBall];
        }
      }

      // Handle individual hands
      const ballsToUpdate: Array<{ id: string; x: number; y: number; color: PlasmaBallColor }> = [];
      const ballsToCreate: Array<{ x: number; y: number; color: PlasmaBallColor }> = [];

      // Check left hand
      if (hands.leftHand.detected && hands.leftHand.position) {
        const existingBall = prev.find((ball) => {
          if (ball.color !== 'blue') return false;
          const dx = ball.x - hands.leftHand.position!.x;
          const dy = ball.y - hands.leftHand.position!.y;
          return Math.sqrt(dx * dx + dy * dy) < threshold;
        });

        if (existingBall) {
          ballsToUpdate.push({
            id: existingBall.id,
            x: hands.leftHand.position.x,
            y: hands.leftHand.position.y,
            color: 'blue',
          });
        } else {
          ballsToCreate.push({
            x: hands.leftHand.position.x,
            y: hands.leftHand.position.y,
            color: 'blue',
          });
        }
      }

      // Check right hand
      if (hands.rightHand.detected && hands.rightHand.position) {
        const existingBall = prev.find((ball) => {
          if (ball.color !== 'red') return false;
          const dx = ball.x - hands.rightHand.position!.x;
          const dy = ball.y - hands.rightHand.position!.y;
          return Math.sqrt(dx * dx + dy * dy) < threshold;
        });

        if (existingBall) {
          ballsToUpdate.push({
            id: existingBall.id,
            x: hands.rightHand.position.x,
            y: hands.rightHand.position.y,
            color: 'red',
          });
        } else {
          ballsToCreate.push({
            x: hands.rightHand.position.x,
            y: hands.rightHand.position.y,
            color: 'red',
          });
        }
      }

      // Update existing balls
      let updated = prev;
      if (ballsToUpdate.length > 0) {
        updated = updated.map((ball) => {
          const update = ballsToUpdate.find((u) => u.id === ball.id);
          return update ? { ...ball, x: update.x, y: update.y } : ball;
        });
      }

      // Create new balls
      if (ballsToCreate.length > 0) {
        const newBalls = ballsToCreate.map((ballData) => {
          const newBall = {
            id: `plasma-${ballData.color}-${plasmaBallIdCounter.current++}`,
            x: ballData.x,
            y: ballData.y,
            rotation: 0,
            createdAt: Date.now(),
            opacity: 1,
            color: ballData.color,
          };

          // Auto-remove ball after 5 seconds
          const fadeStart = 4000;
          const fadeDuration = 1000;

          setTimeout(() => {
            setPlasmaBalls((p) =>
              p.map((ball) =>
                ball.id === newBall.id ? { ...ball, opacity: 0.5 } : ball
              )
            );
          }, fadeStart);

          setTimeout(() => {
            setPlasmaBalls((p) => p.filter((ball) => ball.id !== newBall.id));
          }, fadeStart + fadeDuration);

          return newBall;
        });

        updated = [...updated, ...newBalls];
      }

      // Remove balls for hands that are no longer raised
      return updated.filter((ball) => {
        if (ball.color === 'merged') {
          return hands.handsTogether;
        }
        if (ball.color === 'blue') {
          return hands.leftHand.detected;
        }
        if (ball.color === 'red') {
          return hands.rightHand.detected;
        }
        return true;
      });
    });
  }, [landmarks]);

  // Animate rotation and fade for plasma balls
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.02) % (Math.PI * 2));
      setPlasmaBalls((prev) =>
        prev.map((ball) => {
          const age = Date.now() - ball.createdAt;
          const fadeStart = 4000;
          const fadeDuration = 1000;
          
          // Calculate opacity based on age
          let opacity = 1;
          if (age > fadeStart) {
            const fadeProgress = Math.min((age - fadeStart) / fadeDuration, 1);
            opacity = 1 - fadeProgress;
          }

          return {
            ...ball,
            rotation: (ball.rotation + 0.05) % (Math.PI * 2),
            opacity,
          };
        })
      );
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  // Clean up plasma balls that are too old or when webcam stops
  useEffect(() => {
    if (!isActive) {
      setPlasmaBalls([]);
    }
  }, [isActive]);

  return (
    <main className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Human Movement Heatmap Detection
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Real-time pose detection with simulated heat signature overlay
          </p>
          <p className="text-yellow-400 text-xs mt-2">
            ⚠️ This is a simulated heatmap visualization, not real thermal data
          </p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                Video Feed
              </h2>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <WebcamCapture
                  videoRef={videoRef}
                  stream={stream}
                  isActive={isActive}
                  error={error}
                  nightVisionEnabled={appState.nightVisionEnabled}
                  onVideoReady={handleVideoReady}
                />
                {videoElement && (
                  <>
                    <PoseDetector
                      videoElement={videoElement}
                      onLandmarksDetected={handleLandmarksDetected}
                      onDetectionStateChange={handleDetectionStateChange}
                    />
                    {landmarks && (
                      <MotionAnalyzer
                        landmarks={landmarks}
                        sensitivity={appState.sensitivity}
                        onMovementCalculated={handleMovementCalculated}
                      />
                    )}
                    {movementData && (
                      <HeatmapRenderer
                        ref={heatmapRendererRef}
                        movementData={movementData}
                        videoElement={videoElement}
                        enabled={appState.heatmapEnabled}
                        decayRate={appState.decayRate}
                        skeletonViewEnabled={appState.skeletonViewEnabled}
                      />
                    )}
                    {/* Render plasma balls */}
                    {videoElement &&
                      plasmaBalls.map((ball) => (
                        <PlasmaBall
                          key={ball.id}
                          x={ball.x}
                          y={ball.y}
                          canvasWidth={videoElement.videoWidth || videoElement.clientWidth}
                          canvasHeight={videoElement.videoHeight || videoElement.clientHeight}
                          rotation={ball.rotation}
                          opacity={ball.opacity}
                          color={ball.color}
                        />
                      ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="lg:col-span-1">
            <Controls
              state={appState}
              onStateChange={handleStateChange}
              onStartWebcam={handleStartWebcam}
              onStopWebcam={handleStopWebcam}
              onSwitchCamera={switchCamera}
              facingMode={facingMode}
              isDetecting={isDetecting}
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            How It Works
          </h3>
          <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
            <li>Uses MediaPipe Pose to detect 33 body landmarks in real-time</li>
            <li>Tracks movement between frames to calculate motion intensity</li>
            <li>Visualizes movement as a heatmap: blue/green (low) → yellow (medium) → red (high)</li>
            <li>Heat gradually decays over time for smooth visualization</li>
            <li>All processing happens client-side in your browser</li>
            <li className="text-yellow-400 font-semibold">✨ Raise your left hand for a blue plasma ball, right hand for red!</li>
            <li className="text-purple-400 font-semibold">✨ Put your hands together to merge them into a purple plasma ball!</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
