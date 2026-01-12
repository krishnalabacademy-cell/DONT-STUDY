import React from 'react';
import { Tab } from '../types';
import { FocusIcon, CoachIcon, AnalyzeIcon, TestIcon, ReportIcon } from './Icon';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const NAV_ITEMS: { id: Tab; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'focus', label: 'Focus', icon: FocusIcon },
  { id: 'coach', label: 'Coach', icon: CoachIcon },
  { id: 'analyze', label: 'Analyze', icon: AnalyzeIcon },
  { id: 'test', label: 'Test', icon: TestIcon },
  { id: 'report', label: 'Report', icon: ReportIcon },
];

const NavItem: React.FC<{
  item: typeof NAV_ITEMS[0];
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const textColor = isActive ? 'text-indigo-400' : 'text-gray-400';
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'bg-gray-800' : ''}`}
      aria-label={item.label}
    >
      <Icon className={`w-6 h-6 mb-1 ${textColor}`} />
      <span className={`text-xs font-medium ${textColor}`}>{item.label}</span>
      {isActive && <div className="w-8 h-1 bg-indigo-400 rounded-full mt-1 shadow-lg shadow-indigo-400/50"></div>}
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="flex justify-around bg-gray-900 border-t border-gray-700 shadow-lg sticky bottom-0 z-20">
      {NAV_ITEMS.map((item) => (
        <NavItem
          key={item.id}
          item={item}
          isActive={activeTab === item.id}
          onClick={() => setActiveTab(item.id)}
        />
      ))}
    </nav>
  );
};

export default BottomNav;