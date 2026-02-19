'use client';

/**
 * Controls Component
 * UI controls for toggling features and adjusting parameters
 */

import { AppState } from '@/types';
import clsx from 'clsx';

interface ControlsProps {
  state: AppState;
  onStateChange: (updates: Partial<AppState>) => void;
  onStartWebcam: () => void;
  onStopWebcam: () => void;
  isDetecting?: boolean;
}

export function Controls({
  state,
  onStateChange,
  onStartWebcam,
  onStopWebcam,
  isDetecting = false,
}: ControlsProps) {
  const handleToggle = (key: keyof AppState) => {
    onStateChange({ [key]: !state[key] });
  };

  const handleSliderChange = (key: 'sensitivity' | 'decayRate', value: number) => {
    onStateChange({ [key]: value });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">Controls</h2>

      {/* Webcam Controls */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={onStartWebcam}
            disabled={state.webcamEnabled}
            className={clsx(
              'flex-1 px-4 py-2 rounded-md font-medium transition-colors',
              state.webcamEnabled
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            )}
          >
            Start Webcam
          </button>
          <button
            onClick={onStopWebcam}
            disabled={!state.webcamEnabled}
            className={clsx(
              'flex-1 px-4 py-2 rounded-md font-medium transition-colors',
              !state.webcamEnabled
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            )}
          >
            Stop Webcam
          </button>
        </div>
        {isDetecting && (
          <p className="text-sm text-green-400 text-center">
            ✓ Pose detection active
          </p>
        )}
      </div>

      {/* Toggle Controls */}
      <div className="space-y-2">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-white">Skeleton View</span>
          <button
            onClick={() => handleToggle('skeletonViewEnabled')}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              state.skeletonViewEnabled ? 'bg-blue-600' : 'bg-gray-600'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                state.skeletonViewEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-white">Heatmap View</span>
          <button
            onClick={() => handleToggle('heatmapEnabled')}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              state.heatmapEnabled ? 'bg-blue-600' : 'bg-gray-600'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                state.heatmapEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </label>
      </div>

      {/* Slider Controls */}
      <div className="space-y-4 pt-2 border-t border-gray-700">
        <div>
          <label className="block text-white mb-2">
            Motion Sensitivity: {state.sensitivity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={state.sensitivity}
            onChange={(e) =>
              handleSliderChange('sensitivity', parseInt(e.target.value))
            }
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Less Sensitive</span>
            <span>More Sensitive</span>
          </div>
        </div>

        <div>
          <label className="block text-white mb-2">
            Heat Decay Rate: {state.decayRate}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={state.decayRate}
            onChange={(e) =>
              handleSliderChange('decayRate', parseInt(e.target.value))
            }
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Slow Decay</span>
            <span>Fast Decay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
