import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GalaxyBackground } from './components/CelestialUI';
import { Sidebar } from './components/Sidebar';
import { InitializingUniverse } from './components/InitializingUniverse';
import { Dashboard } from './components/Dashboard';
import { DailyLogging } from './components/DailyLogging';
import { AgentScreen } from './components/AgentScreen';
import { RecentLogsPopup } from './components/RecentLogsPopup';

type AppState = 'initializing' | 'authenticated';
type ActiveTab = 'overview' | 'analytics' | 'activity' | 'log' | 'settings';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('initializing');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Demo: Open popup when clicking a log in Dashboard
  // In a real app, this would be handled by a context or state passed to Dashboard
  useEffect(() => {
    const handleOpenLog = (e: any) => {
      setSelectedLog({
        date: 'April 10',
        title: 'Deep Work: Celestial Engine',
        type: 'Coding',
        score: 94,
        details: 'Focused heavily on the core rendering engine for the Aether interface. Achieved significant breakthroughs in shader optimization and state management. Physical energy remained stable throughout the session.'
      });
      setIsPopupOpen(true);
    };

    window.addEventListener('open-demo-log', handleOpenLog);
    return () => window.removeEventListener('open-demo-log', handleOpenLog);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Dashboard />;
      case 'log':
        return <DailyLogging />;
      case 'activity':
        return <AgentScreen />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-headline font-bold text-white opacity-40 uppercase tracking-[0.2em]">
                {activeTab} Screen
              </h2>
              <p className="text-zinc-500 font-label tracking-widest uppercase text-xs">Under Construction in the Aether</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0e0e0e] text-[#e8e5e4] overflow-hidden font-sans selection:bg-cyan-400/30 selection:text-cyan-100">
      <GalaxyBackground />

      <AnimatePresence mode="wait">
        {appState === 'initializing' ? (
          <motion.div
            key="initializing"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0e0e0e]"
          >
            <InitializingUniverse onComplete={() => setAppState('authenticated')} />
          </motion.div>
        ) : (
          <motion.div
            key="authenticated"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-screen relative z-10"
          >
            <Sidebar 
              activeTab={activeTab} 
              setActiveTab={(tab) => setActiveTab(tab as ActiveTab)} 
              isOpen={isSidebarOpen}
              setIsOpen={setIsSidebarOpen}
            />
            
            <main className={cn(
              "flex-1 flex flex-col transition-all duration-300",
              isSidebarOpen ? "ml-64" : "ml-20"
            )}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </main>

            <RecentLogsPopup 
              isOpen={isPopupOpen} 
              onClose={() => setIsPopupOpen(false)} 
              log={selectedLog} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[999] opacity-[0.03] grain-overlay" />
    </div>
  );
};

// Helper for cn in App.tsx since it's used here
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default App;
