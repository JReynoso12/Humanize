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
  onSwitchCamera?: () => void;
  facingMode?: 'user' | 'environment';
  isDetecting?: boolean;
}

export function Controls({
  state,
  onStateChange,
  onStartWebcam,
  onStopWebcam,
  onSwitchCamera,
  facingMode = 'user',
  isDetecting = false,
}: ControlsProps) {
  const handleToggle = (key: keyof AppState) => {
    onStateChange({ [key]: !state[key] });
  };

  const handleSliderChange = (key: 'sensitivity' | 'decayRate', value: number) => {
    onStateChange({ [key]: value });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Controls</h2>

      {/* Webcam Controls */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onStartWebcam}
            disabled={state.webcamEnabled}
            className={clsx(
              'flex-1 px-4 py-2.5 sm:py-2 rounded-md font-medium transition-colors text-sm sm:text-base',
              'touch-manipulation min-h-[44px] sm:min-h-0',
              state.webcamEnabled
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
            )}
          >
            Start Webcam
          </button>
          <button
            onClick={onStopWebcam}
            disabled={!state.webcamEnabled}
            className={clsx(
              'flex-1 px-4 py-2.5 sm:py-2 rounded-md font-medium transition-colors text-sm sm:text-base',
              'touch-manipulation min-h-[44px] sm:min-h-0',
              !state.webcamEnabled
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
            )}
          >
            Stop Webcam
          </button>
        </div>
        {/* Switch Camera Button - Mobile Only */}
        {onSwitchCamera && state.webcamEnabled && (
          <button
            onClick={onSwitchCamera}
            className={clsx(
              'w-full px-4 py-2.5 sm:py-2 rounded-md font-medium transition-colors text-sm sm:text-base',
              'touch-manipulation min-h-[44px] sm:min-h-0',
              'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
              'md:hidden' // Only show on mobile (hidden on md screens and up)
            )}
            aria-label={`Switch to ${facingMode === 'user' ? 'back' : 'front'} camera`}
          >
            {facingMode === 'user' ? '📷 Switch to Back Camera' : '📷 Switch to Front Camera'}
          </button>
        )}
        {isDetecting && (
          <p className="text-xs sm:text-sm text-green-400 text-center">
            ✓ Pose detection active
          </p>
        )}
      </div>

      {/* Toggle Controls */}
      <div className="space-y-3 sm:space-y-2">
        <label className="flex items-center justify-between cursor-pointer py-1 sm:py-0">
          <span className="text-white text-sm sm:text-base">Skeleton View</span>
          <button
            onClick={() => handleToggle('skeletonViewEnabled')}
            className={clsx(
              'relative inline-flex h-7 w-12 sm:h-6 sm:w-11 items-center rounded-full transition-colors',
              'touch-manipulation',
              state.skeletonViewEnabled ? 'bg-blue-600' : 'bg-gray-600'
            )}
            aria-label="Toggle skeleton view"
          >
            <span
              className={clsx(
                'inline-block h-5 w-5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform',
                state.skeletonViewEnabled ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </label>

        <label className="flex items-center justify-between cursor-pointer py-1 sm:py-0">
          <span className="text-white text-sm sm:text-base">Heatmap View</span>
          <button
            onClick={() => handleToggle('heatmapEnabled')}
            className={clsx(
              'relative inline-flex h-7 w-12 sm:h-6 sm:w-11 items-center rounded-full transition-colors',
              'touch-manipulation',
              state.heatmapEnabled ? 'bg-blue-600' : 'bg-gray-600'
            )}
            aria-label="Toggle heatmap view"
          >
            <span
              className={clsx(
                'inline-block h-5 w-5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform',
                state.heatmapEnabled ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </label>

        <label className="flex items-center justify-between cursor-pointer py-1 sm:py-0">
          <span className="text-white text-sm sm:text-base">Night Vision</span>
          <button
            onClick={() => handleToggle('nightVisionEnabled')}
            disabled={!state.webcamEnabled}
            className={clsx(
              'relative inline-flex h-7 w-12 sm:h-6 sm:w-11 items-center rounded-full transition-colors',
              'touch-manipulation',
              !state.webcamEnabled
                ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                : state.nightVisionEnabled
                ? 'bg-green-600' 
                : 'bg-gray-600'
            )}
            aria-label="Toggle night vision mode"
          >
            <span
              className={clsx(
                'inline-block h-5 w-5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform',
                state.nightVisionEnabled ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </label>
      </div>

      {/* Slider Controls */}
      <div className="space-y-4 pt-2 border-t border-gray-700">
        <div>
          <label className="block text-white mb-2 text-sm sm:text-base">
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
            className="w-full h-3 sm:h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 touch-manipulation"
            style={{ WebkitAppearance: 'none' }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Less Sensitive</span>
            <span>More Sensitive</span>
          </div>
        </div>

        <div>
          <label className="block text-white mb-2 text-sm sm:text-base">
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
            className="w-full h-3 sm:h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 touch-manipulation"
            style={{ WebkitAppearance: 'none' }}
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
