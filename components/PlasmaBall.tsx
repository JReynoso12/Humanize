'use client';

/**
 * PlasmaBall Component
 * Renders a rotating plasma ball effect at a specific position
 */

import { useEffect, useRef } from 'react';

export type PlasmaBallColor = 'blue' | 'red' | 'merged';

interface PlasmaBallProps {
  x: number; // Normalized x position (0-1)
  y: number; // Normalized y position (0-1)
  canvasWidth: number;
  canvasHeight: number;
  rotation: number; // Current rotation angle
  opacity?: number; // Opacity for fade effect (0-1)
  color?: PlasmaBallColor; // Color theme: blue (left), red (right), merged (purple)
}

export function PlasmaBall({
  x,
  y,
  canvasWidth,
  canvasHeight,
  rotation,
  opacity = 1,
  color = 'blue',
}: PlasmaBallProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const centerX = x * canvasWidth;
    const centerY = y * canvasHeight;
    const radius = Math.min(canvasWidth, canvasHeight) * 0.15;

    const render = () => {
      // Clear previous frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create plasma effect with multiple rotating layers
      const time = Date.now() * 0.001;

      // Color scheme based on hand
      let baseR, baseG, baseB;
      if (color === 'blue') {
        // Blue theme for left hand
        baseR = 50;
        baseG = 100;
        baseB = 255;
      } else if (color === 'red') {
        // Red theme for right hand
        baseR = 255;
        baseG = 50;
        baseB = 50;
      } else {
        // Merged/purple theme when hands together
        baseR = 200;
        baseG = 50;
        baseB = 255;
      }

    // Outer glow layer
    const outerGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius * 1.5
    );
    outerGradient.addColorStop(
      0,
      `rgba(${baseR + Math.sin(time + rotation) * 50}, ${
        baseG + Math.cos(time * 1.3 + rotation) * 50
      }, ${baseB}, ${0.8 * opacity})`
    );
    outerGradient.addColorStop(0.5, `rgba(${baseR}, ${baseG + Math.sin(time * 0.7) * 30}, ${baseB}, ${0.4 * opacity})`);
    outerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Middle plasma layer with rotation
    const middleGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius
    );
    const r1 = Math.sin(time * 2 + rotation) * 0.5 + 0.5;
    const g1 = Math.cos(time * 1.5 + rotation) * 0.5 + 0.5;
    const b1 = Math.sin(time * 0.8 + rotation * 0.5) * 0.5 + 0.5;

    // Apply color theme to middle layer
    const r = baseR * (0.5 + r1 * 0.5);
    const g = baseG * (0.5 + g1 * 0.5);
    const b = baseB * (0.5 + b1 * 0.5);

    middleGradient.addColorStop(
      0,
      `rgba(${r}, ${g}, ${b}, ${0.9 * opacity})`
    );
    middleGradient.addColorStop(
      0.3,
      `rgba(${r * 0.8}, ${g * 0.9}, ${b}, ${0.7 * opacity})`
    );
    middleGradient.addColorStop(0.6, `rgba(${r * 0.6}, ${g * 0.7}, ${b * 0.8}, ${0.5 * opacity})`);
    middleGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner core with pulsing effect
    const coreRadius = radius * 0.4 * (1 + Math.sin(time * 3) * 0.2);
    const coreGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      coreRadius
    );
    coreGradient.addColorStop(0, `rgba(255, 255, 255, ${(0.9 + Math.sin(time * 4) * 0.1) * opacity})`);
    coreGradient.addColorStop(0.5, `rgba(${baseR}, ${baseG + Math.sin(time * 2) * 30}, ${baseB}, ${0.8 * opacity})`);
    coreGradient.addColorStop(1, `rgba(${baseR * 0.5}, ${baseG * 0.5}, ${baseB * 0.5}, 0)`);

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    // Add rotating plasma tendrils
    ctx.strokeStyle = `rgba(${baseR}, ${baseG + Math.sin(time * 1.5) * 50}, ${baseB}, ${0.6 * opacity})`;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (let i = 0; i < 8; i++) {
      const angle = (rotation + (i * Math.PI * 2) / 8) % (Math.PI * 2);
      const tendrilLength = radius * (0.6 + Math.sin(time * 2 + i) * 0.3);
      const endX = centerX + Math.cos(angle) * tendrilLength;
      const endY = centerY + Math.sin(angle) * tendrilLength;

      const tendrilGradient = ctx.createLinearGradient(
        centerX,
        centerY,
        endX,
        endY
      );
      tendrilGradient.addColorStop(
        0,
        `rgba(${baseR}, ${baseG + Math.sin(time + i) * 30}, ${baseB}, ${0.8 * opacity})`
      );
      tendrilGradient.addColorStop(1, `rgba(${baseR * 0.4}, ${baseG * 0.4}, ${baseB * 0.4}, 0)`);

      ctx.strokeStyle = tendrilGradient;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(render);
    };

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [x, y, canvasWidth, canvasHeight, rotation, opacity, color]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
