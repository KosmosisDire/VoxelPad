// src/components/tools/ToolBar.tsx
import React from 'react';
import { useToolContext } from '../../context/ToolContext';
import { ToolType } from '../../types/tools';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Paintbrush, Eraser, PenTool, Minus, Square, Move, Undo2, Redo2 } from 'lucide-react';
import { useHistory } from '../../hooks/useHistory';

export const ToolBar: React.FC = () => {
  const { toolState, setActiveTool } = useToolContext();
  const { undoAction, redoAction, canUndo, canRedo } = useHistory();
  
  const voxelTools = [
    { type: ToolType.VOXEL_PLACE, icon: <Paintbrush className="w-5 h-5" />, tooltip: 'Place Voxel' },
    { type: ToolType.ERASER, icon: <Eraser className="w-5 h-5" />, tooltip: 'Erase Voxel' },
  ];
  
  const drawingTools = [
    { type: ToolType.FREE_DRAW, icon: <PenTool className="w-5 h-5" />, tooltip: 'Free Draw' },
    { type: ToolType.LINE, icon: <Minus className="w-5 h-5" />, tooltip: 'Line' },
    { type: ToolType.RECTANGLE, icon: <Square className="w-5 h-5" />, tooltip: 'Rectangle' },
  ];
  
  const navigationTools = [
    { type: ToolType.PAN, icon: <Move className="w-5 h-5" />, tooltip: 'Pan (Middle Mouse)' },
  ];

  const renderToolButton = (tool: any) => (
    <Button
      key={tool.type}
      variant={toolState.activeTool === tool.type ? "default" : "ghost"}
      size="icon"
      onClick={() => setActiveTool(tool.type)}
      className={`h-10 w-10 relative group transition-theme ${
        toolState.activeTool === tool.type ? 'tool-button-active' : 'tool-button-inactive'
      }`}
      title={tool.tooltip}
    >
      {tool.icon}
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
        {tool.tooltip}
      </span>
    </Button>
  );

  return (
    <div className="flex justify-center p-2 w-full">
      <div className="flex items-center gap-1 px-3 py-1 bg-card rounded-lg">
        {voxelTools.map(renderToolButton)}
        
        <Separator orientation="vertical" className="h-8 mx-2 bg-border" />
        
        {drawingTools.map(renderToolButton)}
        
        <Separator orientation="vertical" className="h-8 mx-2 bg-border" />
        
        {/* Undo/Redo Buttons */}
        <Button
          variant="ghost"
          size="icon"
          onClick={undoAction}
          className="h-10 w-10 relative group tool-button-inactive"
          disabled={!canUndo}
          title="Undo"
        >
          <Undo2 className="w-5 h-5" />
          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
            Undo (Ctrl+Z)
          </span>
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={redoAction}
          className="h-10 w-10 relative group tool-button-inactive"
          disabled={!canRedo}
          title="Redo"
        >
          <Redo2 className="w-5 h-5" />
          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
            Redo (Ctrl+Y)
          </span>
        </Button>
        
        <Separator orientation="vertical" className="h-8 mx-2 bg-border" />
        
        {navigationTools.map(renderToolButton)}
      </div>
    </div>
  );
};