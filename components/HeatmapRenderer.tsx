'use client';

/**
 * HeatmapRenderer Component
 * Renders heatmap overlay on canvas as colored lines based on movement intensity
 * - Skeleton connections colored by movement heat
 * - Movement vectors showing direction of motion
 */

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { MovementData } from '@/types';
import { movementToColor, createHeatGradient, applyHeatDecay } from '@/utils/heatmapUtils';

interface HeatmapRendererProps {
  movementData: MovementData | null;
  videoElement: HTMLVideoElement | null;
  enabled: boolean;
  decayRate: number; // 0-100, converted to 0-1
  skeletonViewEnabled?: boolean;
}

export interface HeatmapRendererHandle {
  clear: () => void;
}

export const HeatmapRenderer = forwardRef<HeatmapRendererHandle, HeatmapRendererProps>(
  ({ movementData, videoElement, enabled, decayRate, skeletonViewEnabled = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const heatHistoryRef = useRef<Map<number, number>>(new Map()); // Store heat per landmark
    const animationFrameRef = useRef<number | null>(null);

    // Convert decay rate from 0-100 to 0-1
    const decayFactor = decayRate / 100;

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
        heatHistoryRef.current.clear();
      },
    }));

    // Sync canvas size with video element
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !videoElement) return;

      const updateCanvasSize = () => {
        canvas.width = videoElement.videoWidth || videoElement.clientWidth;
        canvas.height = videoElement.videoHeight || videoElement.clientHeight;
      };

      updateCanvasSize();
      videoElement.addEventListener('loadedmetadata', updateCanvasSize);
      window.addEventListener('resize', updateCanvasSize);

      return () => {
        videoElement.removeEventListener('loadedmetadata', updateCanvasSize);
        window.removeEventListener('resize', updateCanvasSize);
      };
    }, [videoElement]);

    // Render heatmap
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !enabled || !movementData) {
        // Clear canvas if disabled or no movement data
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const render = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply decay to all stored heat values
        heatHistoryRef.current.forEach((heat, index) => {
          const decayedHeat = applyHeatDecay(heat, decayFactor);
          if (decayedHeat > 0.01) {
            heatHistoryRef.current.set(index, decayedHeat);
          } else {
            heatHistoryRef.current.delete(index);
          }
        });

        // Update heat history with current movement
        movementData.landmarks.forEach((landmark, index) => {
          if (landmark.visibility > 0.5) {
            // Get movement intensity for this landmark
            const currentHeat = movementData.intensity;
            const existingHeat = heatHistoryRef.current.get(index) || 0;
            // Combine new heat with existing (max to prevent sudden spikes)
            const newHeat = Math.max(currentHeat, existingHeat * 0.8);
            heatHistoryRef.current.set(index, newHeat);
          }
        });

        // Define skeleton connections for line rendering
        const connections = [
          // Face
          [0, 2], [0, 5], [2, 7], [5, 8],
          // Torso
          [11, 12], [11, 23], [12, 24], [23, 24],
          // Left arm
          [11, 13], [13, 15],
          // Right arm
          [12, 14], [14, 16],
          // Left leg
          [23, 25], [25, 27],
          // Right leg
          [24, 26], [26, 28],
        ];

        // Render heatmap as colored lines connecting landmarks
        connections.forEach(([startIdx, endIdx]) => {
          const startLandmark = movementData.landmarks[startIdx];
          const endLandmark = movementData.landmarks[endIdx];

          if (
            startLandmark &&
            endLandmark &&
            startLandmark.visibility > 0.5 &&
            endLandmark.visibility > 0.5
          ) {
            // Get heat for both endpoints and use the maximum
            const startHeat = heatHistoryRef.current.get(startIdx) || 0;
            const endHeat = heatHistoryRef.current.get(endIdx) || 0;
            const lineHeat = Math.max(startHeat, endHeat);

            if (lineHeat > 0.01) {
              // Convert normalized coordinates to canvas coordinates
              const startX = startLandmark.x * canvas.width;
              const startY = startLandmark.y * canvas.height;
              const endX = endLandmark.x * canvas.width;
              const endY = endLandmark.y * canvas.height;

              // Get color based on heat intensity
              const color = movementToColor(lineHeat);

              // Line thickness based on heat (1px to 8px)
              const lineWidth = 1 + lineHeat * 7;

              // Draw the line
              ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.4 + lineHeat * 0.6})`;
              ctx.lineWidth = lineWidth;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              
              ctx.beginPath();
              ctx.moveTo(startX, startY);
              ctx.lineTo(endX, endY);
              ctx.stroke();
            }
          }
        });

        // Also draw movement vectors as lines (from previous to current position)
        if (movementData.previousLandmarks) {
          movementData.landmarks.forEach((landmark, index) => {
            if (landmark.visibility > 0.5) {
              const previousLandmark = movementData.previousLandmarks![index];
              if (previousLandmark && previousLandmark.visibility > 0.5) {
                const heat = heatHistoryRef.current.get(index) || 0;
                if (heat > 0.05) {
                  const prevX = previousLandmark.x * canvas.width;
                  const prevY = previousLandmark.y * canvas.height;
                  const currX = landmark.x * canvas.width;
                  const currY = landmark.y * canvas.height;

                  // Calculate movement distance
                  const dx = currX - prevX;
                  const dy = currY - prevY;
                  const distance = Math.sqrt(dx * dx + dy * dy);

                  // Only draw if there's significant movement
                  if (distance > 2) {
                    const color = movementToColor(heat);
                    const lineWidth = 1 + heat * 3;

                    // Draw movement vector line
                    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.3 + heat * 0.5})`;
                    ctx.lineWidth = lineWidth;
                    ctx.lineCap = 'round';
                    
                    ctx.beginPath();
                    ctx.moveTo(prevX, prevY);
                    ctx.lineTo(currX, currY);
                    ctx.stroke();

                    // Draw arrowhead at the end
                    const angle = Math.atan2(dy, dx);
                    const arrowLength = Math.min(10, distance * 0.3);
                    const arrowAngle = Math.PI / 6;

                    ctx.beginPath();
                    ctx.moveTo(currX, currY);
                    ctx.lineTo(
                      currX - arrowLength * Math.cos(angle - arrowAngle),
                      currY - arrowLength * Math.sin(angle - arrowAngle)
                    );
                    ctx.moveTo(currX, currY);
                    ctx.lineTo(
                      currX - arrowLength * Math.cos(angle + arrowAngle),
                      currY - arrowLength * Math.sin(angle + arrowAngle)
                    );
                    ctx.stroke();
                  }
                }
              }
            }
          });
        }

        // Draw skeleton if enabled
        if (skeletonViewEnabled) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;

          // Draw connections between landmarks
          const connections = [
            // Face
            [0, 2], [0, 5], [2, 7], [5, 8],
            // Torso
            [11, 12], [11, 23], [12, 24], [23, 24],
            // Left arm
            [11, 13], [13, 15],
            // Right arm
            [12, 14], [14, 16],
            // Left leg
            [23, 25], [25, 27],
            // Right leg
            [24, 26], [26, 28],
          ];

          connections.forEach(([start, end]) => {
            const startLandmark = movementData.landmarks[start];
            const endLandmark = movementData.landmarks[end];

            if (
              startLandmark &&
              endLandmark &&
              startLandmark.visibility > 0.5 &&
              endLandmark.visibility > 0.5
            ) {
              ctx.beginPath();
              ctx.moveTo(
                startLandmark.x * canvas.width,
                startLandmark.y * canvas.height
              );
              ctx.lineTo(
                endLandmark.x * canvas.width,
                endLandmark.y * canvas.height
              );
              ctx.stroke();
            }
          });

          // Draw landmarks as dots
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          movementData.landmarks.forEach((landmark) => {
            if (landmark.visibility > 0.5) {
              ctx.beginPath();
              ctx.arc(
                landmark.x * canvas.width,
                landmark.y * canvas.height,
                3,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
          });
        }

        // Continue animation loop
        animationFrameRef.current = requestAnimationFrame(render);
      };

      // Start rendering loop
      animationFrameRef.current = requestAnimationFrame(render);

      return () => {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [movementData, enabled, decayFactor, skeletonViewEnabled]);

    return (
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />
    );
  }
);

HeatmapRenderer.displayName = 'HeatmapRenderer';
