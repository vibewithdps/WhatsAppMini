import React, { useState } from 'react';
import { SettingsMainScreen } from './settings/SettingsMainScreen';
import { ProfileScreen } from './settings/ProfileScreen';
import { GenericSettingsScreen } from './settings/GenericSettingsScreen';
import { settingsConfig } from './settings/settingsConfig';

export const SettingsModal = ({ isOpen, onClose }) => {
  const [navStack, setNavStack] = useState(['main']); // ['main', 'privacy', 'account', ...]

  if (!isOpen) return null;

  const currentScreen = navStack[navStack.length - 1];

  const pushScreen = (screenId) => {
    setNavStack([...navStack, screenId]);
  };

  const popScreen = () => {
    if (navStack.length > 1) {
      setNavStack(navStack.slice(0, -1));
    } else {
      onClose();
      // Reset stack after close animation finishes
      setTimeout(() => setNavStack(['main']), 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-wa-dark-bg/50 backdrop-blur-sm sm:p-4 animate-fade-in">
      <div className="w-full h-full sm:h-[90vh] sm:max-h-[800px] sm:w-[450px] bg-white dark:bg-wa-dark-bg sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden relative animate-slide-up">
        
        {currentScreen === 'main' && <SettingsMainScreen onNavigate={pushScreen} onClose={popScreen} />}
        {currentScreen === 'profile' && <ProfileScreen onBack={popScreen} />}
        
        {/* Render generic config-driven screens */}
        {settingsConfig[currentScreen] && (
          <GenericSettingsScreen 
            config={settingsConfig[currentScreen]} 
            onBack={popScreen} 
            onNavigate={pushScreen}
          />
        )}
      </div>
      
    </div>
  );
};
