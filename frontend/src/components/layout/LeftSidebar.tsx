// CollabHub AI - Left Sidebar Component

import { useState } from 'react';
import {
  ChatBubbleLeftIcon,
  VideoCameraIcon,
  PresentationChartLineIcon,
  ShareIcon,
  ChartBarIcon,
  DocumentTextIcon,
  FolderIcon,
  CircleStackIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '../../store/index.ts';

interface NavSection {
  title: string;
  items: NavItem[];
  collapsed: boolean;
}

interface NavItem {
  name: string;
  icon: React.ComponentType<any>;
  badge?: string;
  active?: boolean;
  disabled?: boolean;
}

const LeftSidebar = () => {
  const { leftSidebarCollapsed, isRecording, recordingStartTime } = useAppStore();
  const [sections, setSections] = useState<NavSection[]>([
    {
      title: 'Collaboration',
      collapsed: false,
      items: [
        { name: 'Chat', icon: ChatBubbleLeftIcon, active: true },
        { name: 'Meeting', icon: VideoCameraIcon, disabled: true },
        { name: 'Whiteboard', icon: PresentationChartLineIcon, disabled: true },
        { name: 'Screen Share', icon: ShareIcon, disabled: true },
      ],
    },
    {
      title: 'VERA Attribution',
      collapsed: false,
      items: [
        { name: 'Dashboard', icon: ChartBarIcon, disabled: true },
        { name: 'Reports', icon: DocumentTextIcon, disabled: true },
        { name: 'IP Rights', icon: CircleStackIcon, disabled: true },
      ],
    },
    {
      title: 'Analytics',
      collapsed: false,
      items: [
        { name: 'Performance', icon: ChartBarIcon, disabled: true },
      ],
    },
    {
      title: 'Resources',
      collapsed: false,
      items: [
        { name: 'Files & Resources', icon: FolderIcon, disabled: true },
      ],
    },
  ]);

  const toggleSection = (index: number) => {
    setSections(sections.map((section, i) =>
      i === index ? { ...section, collapsed: !section.collapsed } : section
    ));
  };

  const [recordingDuration, setRecordingDuration] = useState('00:00:00');

  // Update recording timer
  if (isRecording && recordingStartTime) {
    setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - recordingStartTime.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRecordingDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);
  }

  if (leftSidebarCollapsed) {
    return (
      <div className="flex flex-col h-full bg-gray-900 p-2">
        <div className="flex items-center justify-center p-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
        </div>
        {/* Collapsed icons */}
        <div className="flex flex-col gap-2">
          <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <ChatBubbleLeftIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            C
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">CollabHub AI</h1>
            <p className="text-xs text-gray-400">Executive Team</p>
          </div>
        </div>

        {/* New Chat Button */}
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          <PlusIcon className="w-5 h-5" />
          New Chat
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-2">
        {sections.map((section, sectionIndex) => (
          <div key={section.title} className="mb-2">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(sectionIndex)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors"
            >
              {section.collapsed ? (
                <ChevronRightIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
              <span className="uppercase text-xs tracking-wide">{section.title}</span>
            </button>

            {/* Section Items */}
            {!section.collapsed && (
              <div className="space-y-1 px-2">
                {section.items.map((item) => (
                  <button
                    key={item.name}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      item.active
                        ? 'bg-blue-600 text-white'
                        : item.disabled
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1 text-left text-sm">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {item.disabled && (
                      <span className="text-xs text-gray-500">Soon</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Session Recording Panel */}
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Session Recording</h3>
            {isRecording && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-400">REC</span>
              </div>
            )}
          </div>

          {isRecording && (
            <div className="text-2xl font-mono text-blue-400 mb-3 text-center">
              {recordingDuration}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => useAppStore.getState().toggleRecording()}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRecording ? 'Stop' : 'Start'}
            </button>
            {isRecording && (
              <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors">
                Pause
              </button>
            )}
          </div>

          {!isRecording && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Record session for audit trail
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
