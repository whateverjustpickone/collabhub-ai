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
import { PROVIDER_COMPANIES, PROVIDER_MODELS } from '../../constants/providers.ts';

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
      mistral: 'from-orange-500 to-orange-600',
      xai: 'from-pink-500 to-pink-600',
      deepseek: 'from-purple-500 to-purple-600',
      manus: 'from-amber-500 to-amber-600',
      meta: 'from-cyan-500 to-cyan-600',
      cohere: 'from-teal-500 to-teal-600',
      alibaba: 'from-orange-600 to-red-600',
      inflection: 'from-purple-500 to-purple-600',
    };
    return colors[provider as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const AgentCard = ({ agent }: { agent: Agent }) => {
    const isActive = activeAgents.includes(agent.id);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const companyName = PROVIDER_COMPANIES[agent.provider] || agent.provider;
    const availableModels = PROVIDER_MODELS[agent.provider] || [];
    const hasMultipleModels = availableModels.length > 1;

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

            {/* Company Name with Model Dropdown */}
            <div
              className="mb-2 relative"
              onMouseEnter={() => hasMultipleModels && setShowModelDropdown(true)}
              onMouseLeave={() => setShowModelDropdown(false)}
            >
              <button
                onClick={() => hasMultipleModels && setShowModelDropdown(!showModelDropdown)}
                className={`text-xs text-gray-500 ${
                  hasMultipleModels ? 'hover:text-gray-300 cursor-pointer' : 'cursor-default'
                } transition-colors`}
              >
                {companyName}
                {hasMultipleModels && <ChevronDownIcon className="inline w-3 h-3 ml-1" />}
              </button>

              {/* Model Dropdown */}
              {showModelDropdown && hasMultipleModels && (
                <div
                  className="absolute z-[9999] left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-2 max-h-[300px] overflow-y-auto"
                >
                  <div className="text-xs text-gray-400 mb-2 px-2 py-1 border-b border-gray-700">
                    Available Models
                  </div>
                  {availableModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        // TODO: Implement model switching
                        console.log(`Switch to ${model.id}`);
                        setShowModelDropdown(false);
                      }}
                      className={`w-full text-left px-2 py-2 rounded hover:bg-gray-700 transition-colors ${
                        agent.id === model.id ? 'bg-gray-700' : ''
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-200">
                        {model.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {model.description}
                      </div>
                    </button>
                  ))}
                </div>
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

  // Define sections with their state and render functions
  const sections = [
    {
      id: 'active',
      isOpen: true,
      title: `Active in Session (${activeAgentList.length})`,
      order: 1, // Always first
      renderHeader: () => (
        <div className="px-4 py-3 bg-gray-800">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400">
            Active in Session ({activeAgentList.length})
          </h2>
        </div>
      ),
      renderContent: () => (
        <div className="flex-1 p-4 space-y-3 overflow-y-auto min-h-0 scrollbar-stable">
          {activeAgentList.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No agents active. Add agents below.
            </p>
          ) : (
            activeAgentList.map((agent) => <AgentCard key={agent.id} agent={agent} />)
          )}
        </div>
      ),
    },
    {
      id: 'available',
      isOpen: showAllAgents,
      title: `Available AI Agents (${agents.length})`,
      order: showAllAgents ? 2 : 10, // Move to bottom when closed
      renderHeader: () => (
        <button
          onClick={() => setShowAllAgents(!showAllAgents)}
          className="flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-750 transition-colors w-full"
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
      ),
      renderContent: () => (
        <div className="flex-1 p-4 space-y-3 overflow-y-auto" style={{ overflowX: 'visible' }}>
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ),
    },
    {
      id: 'vera',
      isOpen: showVERA,
      title: 'VERA Attribution',
      order: showVERA ? 3 : 11, // Move to bottom when closed
      renderHeader: () => (
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
      ),
      renderContent: () => (
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
      ),
    },
  ];

  // Sort sections: open sections at top, closed sections at bottom
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  // Separate open and closed sections
  const openSections = sortedSections.filter(s => s.isOpen);
  const closedSections = sortedSections.filter(s => !s.isOpen);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Open sections */}
      {openSections.map((section, index) => {
        // Determine if this section should expand to fill space
        const shouldExpand =
          section.id === 'available' ||
          (section.id === 'active' && !showAllAgents);

        return (
          <div
            key={section.id}
            className={`${
              shouldExpand
                ? 'flex-1 flex flex-col overflow-hidden'
                : 'flex-shrink-0'
            } ${index > 0 ? 'border-t border-gray-800' : ''}`}
          >
            {section.renderHeader()}
            {section.renderContent()}
          </div>
        );
      })}

      {/* Spacer to push closed sections to bottom */}
      {closedSections.length > 0 && openSections.length > 0 && (
        <div className="flex-1" />
      )}

      {/* Closed sections at bottom */}
      {closedSections.map((section, index) => (
        <div
          key={section.id}
          className={`flex-shrink-0 ${
            index > 0 || openSections.length > 0 ? 'border-t border-gray-800' : ''
          }`}
        >
          {section.renderHeader()}
        </div>
      ))}
    </div>
  );
};

export default RightSidebar;
