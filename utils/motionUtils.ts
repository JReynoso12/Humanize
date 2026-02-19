/**
 * Utility functions for calculating movement from pose landmarks
 */

import { PoseLandmark, BodyRegion } from '@/types';

/**
 * Calculate Euclidean distance between two landmarks
 */
export function calculateLandmarkDistance(
  landmark1: PoseLandmark,
  landmark2: PoseLandmark
): number {
  const dx = landmark1.x - landmark2.x;
  const dy = landmark1.y - landmark2.y;
  const dz = landmark1.z - landmark2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate movement intensity between two sets of landmarks
 * Returns the average distance moved across all visible landmarks
 */
export function calculateMovementIntensity(
  currentLandmarks: PoseLandmark[],
  previousLandmarks: PoseLandmark[]
): number {
  if (!previousLandmarks || previousLandmarks.length === 0) {
    return 0;
  }

  let totalMovement = 0;
  let visibleCount = 0;

  for (let i = 0; i < currentLandmarks.length; i++) {
    const current = currentLandmarks[i];
    const previous = previousLandmarks[i];

    // Only consider visible landmarks
    if (current.visibility > 0.5 && previous.visibility > 0.5) {
      const distance = calculateLandmarkDistance(current, previous);
      totalMovement += distance;
      visibleCount++;
    }
  }

  return visibleCount > 0 ? totalMovement / visibleCount : 0;
}

/**
 * Normalize movement value to 0-1 range
 * Uses a configurable threshold to scale the movement
 */
export function normalizeMovement(
  movement: number,
  threshold: number = 0.05
): number {
  // Apply threshold-based normalization
  // Movement below threshold maps to 0, above maps to 0-1
  const normalized = Math.min(movement / threshold, 1);
  return Math.max(0, normalized);
}

/**
 * Map MediaPipe Pose landmark indices to body regions
 */
const LANDMARK_REGIONS: Record<number, BodyRegion> = {
  // Head (0-10)
  0: 'head', // nose
  2: 'head', // left eye
  5: 'head', // right eye
  7: 'head', // left ear
  8: 'head', // right ear
  // Torso (11-12)
  11: 'torso', // left shoulder
  12: 'torso', // right shoulder
  // Left arm (11, 13, 15)
  13: 'leftArm', // left elbow
  15: 'leftArm', // left wrist
  // Right arm (12, 14, 16)
  14: 'rightArm', // right elbow
  16: 'rightArm', // right wrist
  // Left leg (23, 25, 27)
  23: 'leftLeg', // left hip
  25: 'leftLeg', // left knee
  27: 'leftLeg', // left ankle
  // Right leg (24, 26, 28)
  24: 'rightLeg', // right hip
  26: 'rightLeg', // right knee
  28: 'rightLeg', // right ankle
};

/**
 * Calculate movement per body region
 */
export function getBodyRegionMovement(
  currentLandmarks: PoseLandmark[],
  previousLandmarks: PoseLandmark[]
): Record<string, number> {
  const regionMovement: Record<string, number> = {
    head: 0,
    torso: 0,
    leftArm: 0,
    rightArm: 0,
    leftLeg: 0,
    rightLeg: 0,
  };

  if (!previousLandmarks || previousLandmarks.length === 0) {
    return regionMovement;
  }

  const regionCounts: Record<string, number> = {
    head: 0,
    torso: 0,
    leftArm: 0,
    rightArm: 0,
    leftLeg: 0,
    rightLeg: 0,
  };

  for (let i = 0; i < currentLandmarks.length; i++) {
    const region = LANDMARK_REGIONS[i];
    if (!region) continue;

    const current = currentLandmarks[i];
    const previous = previousLandmarks[i];

    if (current.visibility > 0.5 && previous.visibility > 0.5) {
      const distance = calculateLandmarkDistance(current, previous);
      regionMovement[region] += distance;
      regionCounts[region]++;
    }
  }

  // Average movement per region
  Object.keys(regionMovement).forEach((region) => {
    if (regionCounts[region] > 0) {
      regionMovement[region] /= regionCounts[region];
    }
  });

  return regionMovement;
}
