'use client';

/**
 * PoseDetector Component
 * Wraps MediaPipe Pose detection with dynamic import to prevent SSR issues
 */

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { PoseLandmark } from '@/types';

interface PoseDetectorProps {
  videoElement: HTMLVideoElement | null;
  onLandmarksDetected: (landmarks: PoseLandmark[] | null) => void;
  onDetectionStateChange?: (isDetecting: boolean) => void;
}

// Internal component that uses MediaPipe (must be client-side only)
function PoseDetectorInternal({
  videoElement,
  onLandmarksDetected,
  onDetectionStateChange,
}: PoseDetectorProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (!videoElement) return;

    let isMounted = true;

    const initializePose = async () => {
      try {
        // Dynamic import to prevent SSR issues
        const { Pose } = await import('@mediapipe/pose');
        const { Camera } = await import('@mediapipe/camera_utils');

        if (!isMounted) return;

        // Initialize MediaPipe Pose
        const pose = new Pose({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          },
        });

        pose.setOptions({
          modelComplexity: 1, // Balanced performance
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        // Handle pose detection results
        pose.onResults((results: any) => {
          if (!isMounted) return;

          if (results.poseLandmarks && results.poseLandmarks.length > 0) {
            // Convert MediaPipe landmarks to our format
            const convertedLandmarks: PoseLandmark[] =
              results.poseLandmarks.map((landmark: any) => ({
                x: landmark.x,
                y: landmark.y,
                z: landmark.z || 0,
                visibility: landmark.visibility || 0,
              }));
            onLandmarksDetected(convertedLandmarks);
            onDetectionStateChange?.(true);
          } else {
            onLandmarksDetected(null);
            onDetectionStateChange?.(false);
          }
        });

        // Initialize camera with actual video dimensions
        const videoWidth = videoElement.videoWidth || videoElement.clientWidth || 1280;
        const videoHeight = videoElement.videoHeight || videoElement.clientHeight || 720;
        
        const camera = new Camera(videoElement, {
          onFrame: async () => {
            if (isMounted && poseRef.current) {
              await poseRef.current.send({ image: videoElement });
            }
          },
          width: videoWidth,
          height: videoHeight,
        });

        poseRef.current = pose;
        cameraRef.current = camera;

        // Start camera
        await camera.start();
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing pose detection:', err);
        if (isMounted) {
          if (err instanceof Error) {
            setError(`Pose detection error: ${err.message}`);
          } else {
            setError('Failed to initialize pose detection');
          }
        }
      }
    };

    initializePose();

    return () => {
      isMounted = false;
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
    };
  }, [videoElement, onLandmarksDetected, onDetectionStateChange]);

  // This component doesn't render anything visible
  return null;
}

// Export dynamically imported component with SSR disabled
export const PoseDetector = dynamic(
  () => Promise.resolve(PoseDetectorInternal),
  {
    ssr: false,
  }
);
