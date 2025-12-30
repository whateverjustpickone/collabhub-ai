// CollabHub AI - Main Content Area

import { useState } from 'react';
import {
  PhoneIcon,
  VideoCameraIcon,
  PresentationChartLineIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  AtSymbolIcon,
  CodeBracketIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '../../store/index.ts';
import { Message } from '../../types/index.ts';

const MainContent = () => {
  const { messages, currentChannel, agents, activeAgents } = useAppStore();
  const [messageInput, setMessageInput] = useState('');

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      channelId: currentChannel?.id || 'demo',
      content: messageInput,
      authorType: 'human',
      authorId: 'demo-user',
      authorName: 'John Doe',
      timestamp: new Date().toISOString(),
    };

    useAppStore.getState().addMessage(newMessage);
    setMessageInput('');

    // Call backend API for real LLM responses
    const activeAgentList = agents.filter((a) => activeAgents.includes(a.id));
    activeAgentList.forEach((agent, index) => {
      setTimeout(async () => {
        try {
          const response = await fetch('http://localhost:3001/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: messageInput,
              agentId: agent.id,
              conversationHistory: messages.slice(-10), // Send last 10 messages for context
              activeAgents: activeAgents, // Tell agent who else is active
            }),
          });

          const data = await response.json();

          if (data.success) {
            const agentMessage: Message = {
              id: `${Date.now()}-${agent.id}`,
              channelId: currentChannel?.id || 'demo',
              content: data.response,
              authorType: 'agent',
              authorId: agent.id,
              authorName: agent.name,
              agentProvider: agent.provider,
              timestamp: new Date().toISOString(),
              veraHash: `vera-${Date.now()}...`,
            };
            useAppStore.getState().addMessage(agentMessage);
            useAppStore.getState().incrementContributions();
          } else {
            console.error('Error from backend:', data.error);
          }
        } catch (error) {
          console.error('Error calling backend:', error);
          // Fallback to demo response if backend is down
          const agentMessage: Message = {
            id: `${Date.now()}-${agent.id}`,
            channelId: currentChannel?.id || 'demo',
            content: `[Offline] Backend unavailable. Please check that the backend server is running on port 3001.`,
            authorType: 'agent',
            authorId: agent.id,
            authorName: agent.name,
            agentProvider: agent.provider,
            timestamp: new Date().toISOString(),
          };
          useAppStore.getState().addMessage(agentMessage);
        }
      }, index * 2000);
    });
  };

  const getAgentColor = (provider?: string) => {
    const colors = {
      anthropic: 'bg-orange-500',
      openai: 'bg-green-500',
      google: 'bg-blue-500',
      perplexity: 'bg-indigo-500',
      deepseek: 'bg-purple-500',
      xai: 'bg-pink-500',
      manus: 'bg-amber-500',
    };
    return colors[provider as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div>
          <h2 className="text-lg font-semibold">Multi-Agent Collaboration Session</h2>
          <p className="text-sm text-gray-400">
            {activeAgents.length} agents active
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled
            className="p-2 rounded-lg text-gray-600 cursor-not-allowed"
            title="Coming soon"
          >
            <PhoneIcon className="w-5 h-5" />
          </button>
          <button
            disabled
            className="p-2 rounded-lg text-gray-600 cursor-not-allowed"
            title="Coming soon"
          >
            <VideoCameraIcon className="w-5 h-5" />
          </button>
          <button
            disabled
            className="p-2 rounded-lg text-gray-600 cursor-not-allowed"
            title="Coming soon"
          >
            <PresentationChartLineIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-950">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.authorType === 'human' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {message.authorType === 'system' ? (
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                  <span className="text-sm font-bold">S</span>
                </div>
              ) : message.authorType === 'agent' ? (
                <div
                  className={`w-10 h-10 rounded-full ${getAgentColor(
                    message.agentProvider
                  )} flex items-center justify-center text-white font-bold`}
                >
                  {message.authorName.charAt(0)}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {message.authorName.charAt(0)}
                </div>
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`flex-1 max-w-2xl ${
                message.authorType === 'human' ? 'text-right' : 'text-left'
              }`}
            >
              {/* Author Name & Timestamp */}
              <div className="flex items-center gap-2 mb-1">
                {message.authorType !== 'human' && (
                  <span className="text-sm font-semibold text-gray-300">
                    {message.authorName}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
                {message.veraHash && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500 bg-opacity-20 text-amber-400 border border-amber-500 border-opacity-30">
                    VERA
                  </span>
                )}
              </div>

              {/* Message Content */}
              <div
                className={`inline-block px-4 py-3 rounded-lg ${
                  message.authorType === 'system'
                    ? 'bg-gray-800 text-gray-300'
                    : message.authorType === 'human'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                {message.content}
              </div>

              {/* VERA Hash */}
              {message.veraHash && (
                <div className="text-xs text-gray-500 mt-1 font-mono">
                  Hash: {message.veraHash}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-800 bg-gray-900">
        {/* Rich Text Toolbar */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-800">
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors">
            <span className="font-bold text-sm">B</span>
          </button>
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors">
            <span className="italic text-sm">I</span>
          </button>
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors">
            <PaperClipIcon className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors">
            <PhotoIcon className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors">
            <CodeBracketIcon className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors">
            <FaceSmileIcon className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors">
            <AtSymbolIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Input Field */}
        <div className="flex items-end gap-2">
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message... (@mention agents, use formatting)"
            className="flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] max-h-[200px]"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default MainContent;
