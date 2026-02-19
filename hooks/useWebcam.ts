/**
 * Custom hook for managing webcam stream
 */

import { useState, useEffect, useRef, useCallback } from 'react';

type FacingMode = 'user' | 'environment';

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
  facingMode: FacingMode;
  startWebcam: () => Promise<void>;
  stopWebcam: () => void;
  switchCamera: () => Promise<void>;
}

export function useWebcam(): UseWebcamReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const availableDevicesRef = useRef<MediaDeviceInfo[]>([]);
  const currentDeviceIdRef = useRef<string | null>(null);

  // Enumerate available cameras
  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      availableDevicesRef.current = videoDevices;
      return videoDevices;
    } catch (err) {
      console.error('Error enumerating cameras:', err);
      return [];
    }
  }, []);

  const startWebcamWithFacingMode = useCallback(async (mode: FacingMode, preferredDeviceId?: string) => {
    try {
      setError(null);

      // Stop existing stream if any
      const currentStream = stream;
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          track.stop();
        });
        setStream(null);
      }

      // Clear video element before switching
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Small delay to ensure previous stream is fully stopped
      await new Promise(resolve => setTimeout(resolve, 150));

      // Enumerate cameras to get device IDs (more reliable on mobile)
      const cameras = await enumerateCameras();
      
      let constraints: MediaStreamConstraints['video'];
      
      // If we have a preferred device ID (from switching), use it
      if (preferredDeviceId && preferredDeviceId !== '') {
        constraints = {
          deviceId: { ideal: preferredDeviceId },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
        };
      } else if (cameras.length > 1) {
        // If we have multiple cameras, find the one matching the facing mode
        // First try to find by label
        let targetCamera = cameras.find(camera => {
          const label = camera.label.toLowerCase();
          if (mode === 'user') {
            return label.includes('front') || label.includes('user') || label.includes('facing');
          } else {
            return label.includes('back') || label.includes('rear') || label.includes('environment');
          }
        });

        // If no match by label, try to find a different device than current
        if (!targetCamera && currentDeviceIdRef.current) {
          targetCamera = cameras.find(camera => 
            camera.deviceId !== currentDeviceIdRef.current && camera.deviceId !== ''
          );
        }

        // If still no match, just pick a different one
        if (!targetCamera) {
          targetCamera = cameras.find(camera => 
            camera.deviceId !== currentDeviceIdRef.current && camera.deviceId !== ''
          ) || cameras[0];
        }

        if (targetCamera && targetCamera.deviceId && targetCamera.deviceId !== '') {
          // Use deviceId for more reliable switching (use ideal instead of exact for better compatibility)
          constraints = {
            deviceId: { ideal: targetCamera.deviceId },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 },
          };
          currentDeviceIdRef.current = targetCamera.deviceId;
        } else {
          // Fallback: use facingMode constraint
          constraints = {
            facingMode: mode,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 },
          };
        }
      } else {
        // Single camera or can't enumerate - use facingMode
        constraints = {
          facingMode: mode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
        };
      }

      // Request webcam access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: constraints,
        audio: false,
      });

      // Store the actual device ID from the track
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack && videoTrack.getSettings().deviceId) {
        currentDeviceIdRef.current = videoTrack.getSettings().deviceId!;
      }

      setStream(mediaStream);
      setIsActive(true);
      setFacingMode(mode);

      // Note: srcObject and play() are handled by WebcamCapture component
      // to avoid conflicts and race conditions
    } catch (err) {
      console.error('Error accessing webcam:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera.');
        } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
          // Try with more lenient constraints
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: mode,
              },
              audio: false,
            });
            setStream(fallbackStream);
            setIsActive(true);
            setFacingMode(mode);
            setError(null);
            return;
          } catch (fallbackErr) {
            setError(`Camera error: ${err.message}. Back camera may not be available.`);
          }
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError('Failed to access webcam');
      }
      setIsActive(false);
      setStream(null);
    }
  }, [stream, enumerateCameras]);

  const startWebcam = useCallback(async () => {
    await startWebcamWithFacingMode('user');
  }, [startWebcamWithFacingMode]);

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

  const switchCamera = useCallback(async () => {
    if (!isActive) return;
    
    try {
      // Get available cameras
      const cameras = await enumerateCameras();
      
      if (cameras.length < 2) {
        setError('Only one camera available. Cannot switch.');
        return;
      }

      // Find a different camera than the current one
      const otherCamera = cameras.find(camera => 
        camera.deviceId !== currentDeviceIdRef.current && camera.deviceId !== ''
      );

      const newFacingMode: FacingMode = facingMode === 'user' ? 'environment' : 'user';
      
      // If we found another camera, use its device ID, otherwise use facingMode
      if (otherCamera && otherCamera.deviceId) {
        await startWebcamWithFacingMode(newFacingMode, otherCamera.deviceId);
      } else {
        await startWebcamWithFacingMode(newFacingMode);
      }
    } catch (err) {
      console.error('Error switching camera:', err);
      setError('Failed to switch camera. Please try again.');
    }
  }, [isActive, facingMode, startWebcamWithFacingMode, enumerateCameras]);

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
    facingMode,
    startWebcam,
    stopWebcam,
    switchCamera,
  };
}
