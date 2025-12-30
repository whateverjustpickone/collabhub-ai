/**
 * Digital Muse Badge Component
 * Displays when queries are handled by Digital Muse (local) vs cloud agents
 */

import React from 'react';

export interface DigitalMuseBadgeProps {
  routingStrategy?: 'local' | 'hybrid' | 'cloud-full';
  agentsUsed?: string[];
  cost?: number;
  executionTimeMs?: number;
  show?: boolean;
}

export const DigitalMuseBadge: React.FC<DigitalMuseBadgeProps> = ({
  routingStrategy,
  agentsUsed = [],
  cost = 0,
  executionTimeMs = 0,
  show = true,
}) => {
  if (!show) return null;

  const getBadgeConfig = () => {
    switch (routingStrategy) {
      case 'local':
        return {
          icon: '🎨',
          label: 'Digital Muse',
          color: 'bg-purple-600',
          textColor: 'text-purple-100',
          description: 'Handled locally',
        };
      case 'hybrid':
        return {
          icon: '🎨',
          label: 'Digital Muse + Cloud',
          color: 'bg-indigo-600',
          textColor: 'text-indigo-100',
          description: 'Hybrid processing',
        };
      case 'cloud-full':
        return {
          icon: '☁️',
          label: 'Executive Team',
          color: 'bg-blue-600',
          textColor: 'text-blue-100',
          description: 'Full cloud team',
        };
      default:
        return {
          icon: '🤖',
          label: 'AI',
          color: 'bg-gray-600',
          textColor: 'text-gray-100',
          description: 'Processing',
        };
    }
  };

  const config = getBadgeConfig();

  const formatCost = (cost: number) => {
    if (cost === 0) return 'Free';
    return `$${cost.toFixed(4)}`;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="flex items-center gap-2 mb-2">
      {/* Main Badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.color} ${config.textColor} text-xs font-medium`}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </div>

      {/* Metrics (only show if available) */}
      {(cost > 0 || executionTimeMs > 0) && (
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {cost >= 0 && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Cost:</span>
              <span className={cost === 0 ? 'text-green-400 font-medium' : 'text-gray-300'}>
                {formatCost(cost)}
              </span>
            </div>
          )}

          {executionTimeMs > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Time:</span>
              <span className="text-gray-300">{formatTime(executionTimeMs)}</span>
            </div>
          )}
        </div>
      )}

      {/* Agent Count (for hybrid/cloud) */}
      {agentsUsed.length > 1 && (
        <div className="text-xs text-gray-500">
          {agentsUsed.length} agents consulted
        </div>
      )}
    </div>
  );
};

/**
 * Compact version for inline display
 */
export const DigitalMuseBadgeCompact: React.FC<DigitalMuseBadgeProps> = ({
  routingStrategy,
  cost = 0,
  show = true,
}) => {
  if (!show) return null;

  const getIcon = () => {
    switch (routingStrategy) {
      case 'local':
        return '🎨';
      case 'hybrid':
        return '🎨☁️';
      case 'cloud-full':
        return '☁️';
      default:
        return '🤖';
    }
  };

  const getTooltip = () => {
    switch (routingStrategy) {
      case 'local':
        return 'Handled locally by Digital Muse (free)';
      case 'hybrid':
        return `Hybrid processing (Digital Muse + Cloud) - $${cost.toFixed(4)}`;
      case 'cloud-full':
        return `Full Executive Team - $${cost.toFixed(4)}`;
      default:
        return 'Processing...';
    }
  };

  return (
    <span
      className="inline-block text-sm cursor-help"
      title={getTooltip()}
      aria-label={getTooltip()}
    >
      {getIcon()}
    </span>
  );
};

/**
 * Digital Muse Status Indicator (for header/status bar)
 */
export const DigitalMuseStatus: React.FC<{
  available: boolean;
  model?: string;
}> = ({ available, model }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            available ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
          }`}
        />
        <span className="text-sm font-medium text-gray-300">Digital Muse</span>
      </div>

      {available && model && (
        <span className="text-xs text-gray-500">{model}</span>
      )}

      {!available && (
        <span className="text-xs text-yellow-500">Cloud only</span>
      )}
    </div>
  );
};

export default DigitalMuseBadge;
