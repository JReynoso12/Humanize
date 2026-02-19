/**
 * Custom hook for MediaPipe Pose detection
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { PoseLandmark } from '@/types';

interface UsePoseDetectionReturn {
  landmarks: PoseLandmark[] | null;
  isDetecting: boolean;
  error: string | null;
  initializePose: (videoElement: HTMLVideoElement) => Promise<void>;
  cleanup: () => void;
}

export function usePoseDetection(): UsePoseDetectionReturn {
  const [landmarks, setLandmarks] = useState<PoseLandmark[] | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  const initializePose = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      setError(null);
      setIsDetecting(false);

      // Dynamic import to prevent SSR issues
      const { Pose } = await import('@mediapipe/pose');
      const { Camera } = await import('@mediapipe/camera_utils');

      // Initialize MediaPipe Pose
      const pose = new Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      pose.setOptions({
        modelComplexity: 1, // Balanced performance (0=light, 1=full, 2=heavy)
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      // Handle pose detection results
      pose.onResults((results: any) => {
        if (results.poseLandmarks && results.poseLandmarks.length > 0) {
          // Convert MediaPipe landmarks to our format
          const convertedLandmarks: PoseLandmark[] = results.poseLandmarks.map(
            (landmark: any) => ({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z || 0,
              visibility: landmark.visibility || 0,
            })
          );
          setLandmarks(convertedLandmarks);
          setIsDetecting(true);
        } else {
          setLandmarks(null);
          setIsDetecting(false);
        }
      });

      // Initialize camera
      const camera = new Camera(videoElement, {
        onFrame: async () => {
          await pose.send({ image: videoElement });
        },
        width: 1280,
        height: 720,
      });

      poseRef.current = pose;
      cameraRef.current = camera;

      // Start camera
      await camera.start();
    } catch (err) {
      console.error('Error initializing pose detection:', err);
      if (err instanceof Error) {
        setError(`Pose detection error: ${err.message}`);
      } else {
        setError('Failed to initialize pose detection');
      }
      setIsDetecting(false);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }
    setLandmarks(null);
    setIsDetecting(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    landmarks,
    isDetecting,
    error,
    initializePose,
    cleanup,
  };
}
