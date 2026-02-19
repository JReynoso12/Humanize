'use client';

/**
 * MotionAnalyzer Component
 * Analyzes pose landmarks to calculate movement intensity
 */

import { useEffect, useRef, useMemo } from 'react';
import { PoseLandmark, MovementData } from '@/types';
import {
  calculateMovementIntensity,
  normalizeMovement,
  getBodyRegionMovement,
} from '@/utils/motionUtils';

interface MotionAnalyzerProps {
  landmarks: PoseLandmark[] | null;
  sensitivity: number; // 0-100, converted to threshold
  onMovementCalculated: (movementData: MovementData | null) => void;
}

export function MotionAnalyzer({
  landmarks,
  sensitivity,
  onMovementCalculated,
}: MotionAnalyzerProps) {
  const previousLandmarksRef = useRef<PoseLandmark[] | null>(null);

  // Convert sensitivity (0-100) to movement threshold
  // Higher sensitivity = lower threshold (more sensitive)
  const threshold = useMemo(() => {
    // Map 0-100 to 0.01-0.1 threshold range
    return 0.01 + (100 - sensitivity) * 0.0009;
  }, [sensitivity]);

  useEffect(() => {
    if (!landmarks || landmarks.length === 0) {
      previousLandmarksRef.current = null;
      onMovementCalculated(null);
      return;
    }

    // Calculate movement if we have previous landmarks
    if (previousLandmarksRef.current) {
      const rawIntensity = calculateMovementIntensity(
        landmarks,
        previousLandmarksRef.current
      );

      const normalizedIntensity = normalizeMovement(rawIntensity, threshold);
      const regionMovement = getBodyRegionMovement(
        landmarks,
        previousLandmarksRef.current
      );

      const movementData: MovementData = {
        intensity: normalizedIntensity,
        regionMovement,
        landmarks,
        previousLandmarks: previousLandmarksRef.current,
      };

      onMovementCalculated(movementData);
    } else {
      // First frame - no movement yet
      onMovementCalculated({
        intensity: 0,
        regionMovement: {
          head: 0,
          torso: 0,
          leftArm: 0,
          rightArm: 0,
          leftLeg: 0,
          rightLeg: 0,
        },
        landmarks,
      });
    }

    // Store current landmarks for next frame
    previousLandmarksRef.current = [...landmarks];
  }, [landmarks, threshold, onMovementCalculated]);

  // This component doesn't render anything visible
  return null;
}
