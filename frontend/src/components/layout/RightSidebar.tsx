// CollabHub AI - Right Sidebar Component

import { useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '../../store/index.ts';
import { Agent } from '../../types/index.ts';

const RightSidebar = () => {
  const { agents, activeAgents, toggleAgent, contributionCount, contributorCount } =
    useAppStore();
  const [showAllAgents, setShowAllAgents] = useState(true);
  const [showVERA, setShowVERA] = useState(true);

  const activeAgentList = agents.filter((a) => activeAgents.includes(a.id));
  const inactiveAgentList = agents.filter((a) => !activeAgents.includes(a.id));

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'thinking':
        return 'text-amber-500';
      default:
        return 'text-gray-500';
    }
  };

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'thinking':
        return <ArrowPathIcon className="w-5 h-5 animate-spin" />;
      default:
        return <XCircleIcon className="w-5 h-5" />;
    }
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      anthropic: 'from-orange-500 to-orange-600',
      openai: 'from-green-500 to-green-600',
      google: 'from-blue-500 to-blue-600',
      perplexity: 'from-indigo-500 to-indigo-600',
      deepseek: 'from-purple-500 to-purple-600',
      xai: 'from-pink-500 to-pink-600',
      manus: 'from-amber-500 to-amber-600',
    };
    return colors[provider as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const AgentCard = ({ agent }: { agent: Agent }) => {
    const isActive = activeAgents.includes(agent.id);

    return (
      <div
        className={`p-3 rounded-lg border transition-all ${
          isActive
            ? 'bg-gray-800 border-gray-700'
            : 'bg-gray-900 border-gray-800 opacity-60'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getProviderColor(
              agent.provider
            )} flex items-center justify-center text-white font-bold flex-shrink-0`}
          >
            {agent.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
              {isActive && (
                <span className="px-1.5 py-0.5 bg-blue-500 bg-opacity-20 text-blue-400 text-xs rounded font-medium">
                  ACTIVE
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-2 line-clamp-2">
              {agent.description}
            </p>

            {/* Status */}
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-1 text-xs ${getAgentStatusColor(agent.status)}`}>
                {getAgentStatusIcon(agent.status)}
                <span className="capitalize">{agent.status}</span>
              </div>

              {agent.priority === 1 && (
                <span className="text-xs text-amber-400 font-medium">Big 4</span>
              )}
              {agent.priority === 2 && (
                <span className="text-xs text-gray-500">Phase 2</span>
              )}
            </div>
          </div>
        </div>

        {/* Capabilities Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {agent.capabilities.slice(0, 2).map((capability, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-gray-700 bg-opacity-50 text-gray-400 text-xs rounded"
            >
              {capability}
            </span>
          ))}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => toggleAgent(agent.id)}
          disabled={agent.status === 'offline'}
          className={`w-full mt-3 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            isActive
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : agent.status === 'offline'
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isActive ? 'Remove from Session' : agent.status === 'offline' ? 'Offline' : 'Add to Session'}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 overflow-hidden">
      {/* Active Agents Section */}
      <div className="flex-shrink-0 border-b border-gray-800">
        <div className="px-4 py-3 bg-gray-800">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400">
            Active in Session ({activeAgentList.length})
          </h2>
        </div>

        <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
          {activeAgentList.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No agents active. Add agents below.
            </p>
          ) : (
            activeAgentList.map((agent) => <AgentCard key={agent.id} agent={agent} />)
          )}
        </div>
      </div>

      {/* Available Agents Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <button
          onClick={() => setShowAllAgents(!showAllAgents)}
          className="flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-750 transition-colors"
        >
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400">
            Available AI Agents ({agents.length})
          </h2>
          {showAllAgents ? (
            <ChevronUpIcon className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showAllAgents && (
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>

      {/* VERA Attribution Panel */}
      <div className="flex-shrink-0 border-t border-gray-800">
        <button
          onClick={() => setShowVERA(!showVERA)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-750 transition-colors"
        >
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400">
            VERA Attribution
          </h2>
          {showVERA ? (
            <ChevronUpIcon className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showVERA && (
          <div className="p-4 bg-gradient-to-br from-amber-500 from-opacity-10 to-orange-500 to-opacity-5">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-amber-400">{contributionCount}</div>
                <div className="text-xs text-gray-400">Contributions</div>
              </div>
              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-amber-400">{contributorCount}</div>
                <div className="text-xs text-gray-400">Contributors</div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-400 mb-4">
              Every AI contribution is tracked with cryptographic integrity using SHA-256
              hashing. Full transparency guaranteed.
            </p>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 bg-opacity-20 hover:bg-opacity-30 text-amber-400 border border-amber-500 border-opacity-30 rounded-lg transition-colors text-sm font-medium cursor-not-allowed opacity-50"
              >
                <DocumentTextIcon className="w-4 h-4" />
                View Report
                <span className="text-xs">(Soon)</span>
              </button>

              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 bg-opacity-20 hover:bg-opacity-30 text-amber-400 border border-amber-500 border-opacity-30 rounded-lg transition-colors text-sm font-medium cursor-not-allowed opacity-50"
              >
                <ShieldCheckIcon className="w-4 h-4" />
                Generate Certificate
                <span className="text-xs">(Soon)</span>
              </button>
            </div>

            {/* Badge */}
            <div className="mt-4 text-center">
              <span className="inline-flex items-center px-3 py-1 bg-amber-500 bg-opacity-20 text-amber-400 border border-amber-500 border-opacity-30 rounded-full text-xs font-medium">
                🔒 Blockchain-Ready
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
