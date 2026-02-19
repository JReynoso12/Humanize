/**
 * Type definitions for the Human Movement Heatmap Detection application
 */

/**
 * Represents a single pose landmark from MediaPipe Pose
 */
export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

/**
 * Movement data calculated from pose landmarks
 */
export interface MovementData {
  intensity: number; // Overall movement intensity (0-1)
  regionMovement: Record<string, number>; // Movement per body region
  landmarks: PoseLandmark[]; // Current frame landmarks
  previousLandmarks?: PoseLandmark[]; // Previous frame landmarks for comparison
}

/**
 * Configuration for heatmap visualization
 */
export interface HeatmapConfig {
  sensitivity: number; // Motion sensitivity threshold (0-1)
  decayRate: number; // Heat decay rate per frame (0-1)
  enabled: boolean; // Whether heatmap is visible
}

/**
 * Body regions for movement tracking
 */
export type BodyRegion =
  | 'head'
  | 'torso'
  | 'leftArm'
  | 'rightArm'
  | 'leftLeg'
  | 'rightLeg';

/**
 * RGB color representation
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Application state interface
 */
export interface AppState {
  webcamEnabled: boolean;
  skeletonViewEnabled: boolean;
  heatmapEnabled: boolean;
  sensitivity: number; // 0-100
  decayRate: number; // 0-100
}
