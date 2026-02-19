'use client';

/**
 * WebcamCapture Component
 * Handles webcam access and video element rendering
 */

import { useEffect } from 'react';

interface WebcamCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
  nightVisionEnabled?: boolean;
  onVideoReady?: (videoElement: HTMLVideoElement | null) => void;
}

export function WebcamCapture({ videoRef, stream, isActive, error, nightVisionEnabled = false, onVideoReady }: WebcamCaptureProps) {
  // Attach stream to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      // Only update if the stream has changed
      if (video.srcObject !== stream) {
        // Set the new stream (autoPlay attribute will handle playing)
        video.srcObject = stream;
        
        // Manually trigger play if autoPlay didn't work
        // Handle AbortError gracefully (it's expected when srcObject changes)
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err: any) => {
            // AbortError is expected when srcObject changes rapidly - not a real error
            // NotAllowedError means autoplay was blocked - user interaction required
            if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
              console.error('Error playing video:', err);
            }
          });
        }
      }
    } else {
      // Clear the video when stream is null
      video.pause();
      video.srcObject = null;
    }
  }, [videoRef, stream]);

  // Notify parent when video element is ready
  useEffect(() => {
    if (videoRef.current && isActive && onVideoReady) {
      onVideoReady(videoRef.current);
    } else if (!isActive && onVideoReady) {
      onVideoReady(null);
    }
  }, [videoRef, onVideoReady, isActive]);

  // Night vision filter: grayscale + contrast + brightness + green tint
  const nightVisionFilter = nightVisionEnabled
    ? 'grayscale(100%) contrast(150%) brightness(120%) sepia(100%) hue-rotate(90deg) saturate(200%)'
    : 'none';

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transition-all duration-300"
        style={{ 
          imageRendering: 'auto',
          filter: nightVisionFilter,
        }}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white p-4 text-center">
          <div>
            <p className="text-red-400 font-semibold mb-2">Camera Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      {!isActive && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Camera Inactive</p>
            <p className="text-sm text-gray-400">
              Click &quot;Start Webcam&quot; to begin
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
