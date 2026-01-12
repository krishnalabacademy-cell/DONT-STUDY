import React, { useState, useEffect, lazy, Suspense } from 'react';
import SplashAnimation from './components/SplashAnimation';
import BottomNav from './components/BottomNav';
import { Tab } from './types';
import ErrorBoundary from './components/ErrorBoundary';
import { FocusIcon, CoachIcon, AnalyzeIcon, TestIcon, ReportIcon, SparklesIcon } from './components/Icon';
import useOnlineStatus from './hooks/useOnlineStatus';

const FocusScreen = lazy(() => import('./components/FocusScreen'));
const CoachScreen = lazy(() => import('./components/CoachScreen'));
const AnalyzeScreen = lazy(() => import('./components/AnalyzeScreen'));
const TestScreen = lazy(() => import('./components/TestScreen'));
const ReportScreen = lazy(() => import('./components/ReportScreen'));

const SCREENS: Record<Tab, React.LazyExoticComponent<React.FC<any>>> = {
  focus: FocusScreen,
  coach: CoachScreen,
  analyze: AnalyzeScreen,
  test: TestScreen,
  report: ReportScreen,
};

const AppHeader: React.FC<{ isOnline: boolean; activeTab: Tab }> = ({ isOnline, activeTab }) => {
    const ICONS: Record<Tab, React.FC<any>> = {
        focus: FocusIcon,
        coach: CoachIcon,
        analyze: AnalyzeIcon,
        test: TestIcon,
        report: ReportIcon,
    };
    const ActiveIcon = ICONS[activeTab] || SparklesIcon;
    const title = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

    return (
        <header className="flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-20">
            <div className="flex items-center space-x-3">
                <ActiveIcon className="w-7 h-7 text-indigo-400" />
                <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
            </div>
            <div className="flex items-center space-x-2">
                <span className={`text-xs font-semibold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
        </header>
    );
};


const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('focus');
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashAnimation />;
  }

  const ActiveScreen = SCREENS[activeTab];

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen w-full bg-gradient-to-br from-gray-900 to-black font-sans text-gray-100 md:max-w-sm md:mx-auto md:my-4 md:rounded-2xl md:shadow-2xl md:h-[calc(100vh-2rem)] overflow-hidden border border-gray-700 md:border-2">
        <AppHeader isOnline={isOnline} activeTab={activeTab} />
        <main className="flex-1 overflow-y-auto bg-gray-800">
          <Suspense fallback={<div className="flex justify-center items-center h-full"><p>Loading...</p></div>}>
            <ActiveScreen />
          </Suspense>
        </main>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </ErrorBoundary>
  );
};

export default App;