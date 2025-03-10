// src/components/layout/ToolSettingsSidebar.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToolContext } from '../../context/ToolContext';
import { ToolType } from '../../types/tools';
import { ColorPicker } from '../tools/ColorPicker';
import { DrawingTools } from '../tools/DrawingTools';
import { VoxelTools } from '../tools/VoxelTools';
import { PanTool } from '../tools/PanTool';

interface ToolSettingsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ToolSettingsSidebar: React.FC<ToolSettingsSidebarProps> = ({ isOpen, onToggle }) => {
  const { toolState } = useToolContext();

  // Determine which settings to show based on the active tool
  const renderToolSettings = () => {
    switch (toolState.activeTool) {
      case ToolType.VOXEL_PLACE:
      case ToolType.ERASER:
        return (
          <div className="space-y-6">
            <VoxelTools />
            <ColorPicker />
          </div>
        );
      case ToolType.FREE_DRAW:
      case ToolType.LINE:
      case ToolType.RECTANGLE:
        return (
          <div className="space-y-6">
            <DrawingTools />
            <ColorPicker />
          </div>
        );
      case ToolType.PAN:
        return (
          <div className="space-y-6">
            <PanTool />
          </div>
        );
      default:
        return <div>No settings available</div>;
    }
  };

  return (
    <div className={`flex h-full transition-all duration-300 ${isOpen ? 'w-72' : 'w-8'} absolute right-0 top-0 bottom-0 z-10 pointer-events-auto`}>
      <div className="flex items-center h-full">
        <Button
          variant="ghost"
          size="icon"
          className="h-16 w-8 rounded-r-none rounded-l-lg sidebar-bg border border-r-0 hover:bg-accent hover:text-accent-foreground transition-theme"
          onClick={onToggle}
        >
          {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
      
      <div className={`sidebar-bg border-l flex flex-col h-full pointer-events-auto ${isOpen ? 'flex-1' : 'w-0 overflow-hidden'}`}>
        <div className="p-4 overflow-y-auto flex-1">
          <h2 className="text-xl font-bold mb-6 text-foreground">Tool Settings</h2>
          {renderToolSettings()}
        </div>
      </div>
    </div>
  );
};