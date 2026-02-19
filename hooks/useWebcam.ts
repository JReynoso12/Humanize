/**
 * Custom hook for managing webcam stream
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
  startWebcam: () => Promise<void>;
  stopWebcam: () => void;
}

export function useWebcam(): UseWebcamReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startWebcam = useCallback(async () => {
    try {
      setError(null);

      // Request webcam access with high quality settings
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 24 },
          facingMode: 'user', // Front-facing camera
          // Request high quality
          aspectRatio: { ideal: 16 / 9 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsActive(true);

      // Note: srcObject and play() are handled by WebcamCapture component
      // to avoid conflicts and race conditions
    } catch (err) {
      console.error('Error accessing webcam:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera.');
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError('Failed to access webcam');
      }
      setIsActive(false);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (stream) {
      // Stop all tracks
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
      setIsActive(false);
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  return {
    videoRef,
    stream,
    isActive,
    error,
    startWebcam,
    stopWebcam,
  };
}
