// src/components/tools/ColorPicker.tsx
import React from 'react';
import { useToolContext } from '../../context/ToolContext';
import { ToolType } from '../../types/tools';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#000000', // Black
  '#FFFFFF', // White
];

export const ColorPicker: React.FC = () => {
  const { toolState, setActiveColor } = useToolContext();
  
  // Don't show color picker for eraser
  if (toolState.activeTool === ToolType.ERASER) {
    return null;
  }
  
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-lg font-medium">Color</Label>
        <div className="flex items-center mt-1 space-x-2">
          <div 
            className="w-8 h-8 border border-gray-500 rounded"
            style={{ backgroundColor: toolState.activeColor }}
          />
          <Input
            type="color"
            value={toolState.activeColor}
            onChange={(e) => setActiveColor(e.target.value)}
            className="w-12 h-8"
          />
          <Input
            type="text"
            value={toolState.activeColor}
            onChange={(e) => setActiveColor(e.target.value)}
            className="w-24 h-8"
            maxLength={7}
          />
        </div>
      </div>
      
      <div>
        <Label>Palette</Label>
        <div className="grid grid-cols-5 gap-2 mt-1">
          {DEFAULT_COLORS.map((color) => (
            <Button
              key={color}
              className="w-8 h-8 p-0"
              style={{ backgroundColor: color }}
              onClick={() => setActiveColor(color)}
              variant={toolState.activeColor === color ? "default" : "ghost"}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};