// src/components/layout/Layout.tsx
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ToolBar } from '../tools/ToolBar';
import { Grid } from '../grid/Grid';
import { ToolSettingsSidebar } from './ToolSettingsSidebar';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toolSettingsOpen, setToolSettingsOpen] = useState(true);
  
  return (
    <div className="flex flex-col h-screen text-white bg-gray-950 overflow-hidden">
      <header className="bg-gray-900 border-b border-gray-800 p-4 relative z-20">
        <h1 className="text-2xl font-bold">Voxel Grid Visualizer</h1>
      </header>
      
      <div className="flex-1 flex relative">
        {/* Left sidebar - with semi-transparent background */}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main content area with grid that fills available space */}
        <div className="flex-1 flex flex-col h-full relative">
          {/* Grid positioned to fill the main content area only */}
          <div className="absolute inset-0 z-0">
            <Grid 
              showChunkBorders={true} 
              showGrid={true}
              sidebarOpen={sidebarOpen}
              toolSettingsOpen={toolSettingsOpen}
            />
          </div>
          
          {/* Right sidebar - with semi-transparent background */}
          <ToolSettingsSidebar 
            isOpen={toolSettingsOpen} 
            onToggle={() => setToolSettingsOpen(!toolSettingsOpen)} 
          />
        </div>
      </div>
      
      <footer className="border-t border-gray-800 bg-gray-900 z-20">
        <ToolBar />
      </footer>
    </div>
  );
};