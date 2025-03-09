// src/components/layout/Sidebar.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GridControls } from '../grid/GridControls';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  return (
    <div className={`flex h-full transition-all duration-300 ${isOpen ? 'w-80' : 'w-8'} absolute left-0 top-0 bottom-0 z-10 pointer-events-auto`}>
      <div className={`bg-gray-900 bg-opacity-90 border-r border-gray-800 flex flex-col h-full pointer-events-auto ${isOpen ? 'flex-1' : 'w-0 overflow-hidden'}`}>
        <div className="p-4 overflow-y-auto flex-1">
          <h2 className="text-xl font-bold mb-6">Grid Settings</h2>
          <GridControls />
        </div>
      </div>
      
      <div className="flex items-center h-full">
        <Button
          variant="ghost"
          size="icon"
          className="h-16 w-8 rounded-l-none rounded-r-lg bg-gray-900 bg-opacity-90 border border-l-0 border-gray-800 pointer-events-auto"
          onClick={onToggle}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};