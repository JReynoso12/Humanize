/**
 * Utility functions for gesture detection
 */

import { PoseLandmark } from '@/types';

/**
 * Detect if hands are raised
 * Returns information about both left and right hands separately
 */
export function detectRaisedHands(landmarks: PoseLandmark[]): {
  leftHand: { detected: boolean; position: { x: number; y: number } | null };
  rightHand: { detected: boolean; position: { x: number; y: number } | null };
  handsTogether: boolean;
  mergedPosition: { x: number; y: number } | null;
} {
  if (!landmarks || landmarks.length < 17) {
    return {
      leftHand: { detected: false, position: null },
      rightHand: { detected: false, position: null },
      handsTogether: false,
      mergedPosition: null,
    };
  }

  // MediaPipe Pose landmark indices:
  // 11: Left shoulder
  // 12: Right shoulder
  // 13: Left elbow
  // 14: Right elbow
  // 15: Left wrist
  // 16: Right wrist

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  const threshold = 0.15; // Minimum vertical distance to consider "raised"
  const mergeThreshold = 0.1; // Distance threshold for merging hands

  let leftHandDetected = false;
  let rightHandDetected = false;
  let leftPosition: { x: number; y: number } | null = null;
  let rightPosition: { x: number; y: number } | null = null;

  // Check left hand
  if (
    leftWrist.visibility > 0.5 &&
    leftElbow.visibility > 0.5 &&
    leftShoulder.visibility > 0.5
  ) {
    const wristAboveElbow = leftWrist.y < leftElbow.y - threshold;
    const wristAboveShoulder = leftWrist.y < leftShoulder.y - threshold * 0.5;

    if (wristAboveElbow && wristAboveShoulder) {
      leftHandDetected = true;
      leftPosition = { x: leftWrist.x, y: leftWrist.y };
    }
  }

  // Check right hand
  if (
    rightWrist.visibility > 0.5 &&
    rightElbow.visibility > 0.5 &&
    rightShoulder.visibility > 0.5
  ) {
    const wristAboveElbow = rightWrist.y < rightElbow.y - threshold;
    const wristAboveShoulder = rightWrist.y < rightShoulder.y - threshold * 0.5;

    if (wristAboveElbow && wristAboveShoulder) {
      rightHandDetected = true;
      rightPosition = { x: rightWrist.x, y: rightWrist.y };
    }
  }

  // Check if hands are close together (merged)
  let handsTogether = false;
  let mergedPosition: { x: number; y: number } | null = null;

  if (leftHandDetected && rightHandDetected && leftPosition && rightPosition) {
    const dx = leftPosition.x - rightPosition.x;
    const dy = leftPosition.y - rightPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < mergeThreshold) {
      handsTogether = true;
      // Use midpoint for merged position
      mergedPosition = {
        x: (leftPosition.x + rightPosition.x) / 2,
        y: (leftPosition.y + rightPosition.y) / 2,
      };
    }
  }

  return {
    leftHand: {
      detected: leftHandDetected && !handsTogether,
      position: handsTogether ? null : leftPosition,
    },
    rightHand: {
      detected: rightHandDetected && !handsTogether,
      position: handsTogether ? null : rightPosition,
    },
    handsTogether,
    mergedPosition,
  };
}

/**
 * Legacy function for backward compatibility
 */
export function detectRaisedFinger(landmarks: PoseLandmark[]): {
  detected: boolean;
  hand: 'left' | 'right' | null;
  position: { x: number; y: number } | null;
} {
  const result = detectRaisedHands(landmarks);
  
  if (result.handsTogether && result.mergedPosition) {
    return {
      detected: true,
      hand: null,
      position: result.mergedPosition,
    };
  }
  
  if (result.leftHand.detected && result.leftHand.position) {
    return {
      detected: true,
      hand: 'left',
      position: result.leftHand.position,
    };
  }
  
  if (result.rightHand.detected && result.rightHand.position) {
    return {
      detected: true,
      hand: 'right',
      position: result.rightHand.position,
    };
  }
  
  return { detected: false, hand: null, position: null };
}
