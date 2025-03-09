// src/components/tools/DrawingTools.tsx
import React from 'react';
import { useToolContext } from '../../context/ToolContext';
import { ToolType } from '../../types/tools';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Trash } from 'lucide-react';

export const DrawingTools: React.FC = () => {
  const { toolState, setBrushSize, clearAnnotations } = useToolContext();
  
  // Get the current drawing tool name
  const getToolName = () => {
    switch (toolState.activeTool) {
      case ToolType.FREE_DRAW:
        return "Free Draw";
      case ToolType.LINE:
        return "Line";
      case ToolType.RECTANGLE:
        return "Rectangle";
      default:
        return "Drawing";
    }
  };
  
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-medium">{getToolName()} Tool</Label>
        <p className="text-sm text-gray-400 mt-1">
          {toolState.activeTool === ToolType.FREE_DRAW && "Click and drag to create free-form drawings"}
          {toolState.activeTool === ToolType.LINE && "Click and drag to draw a straight line"}
          {toolState.activeTool === ToolType.RECTANGLE && "Click and drag to create a rectangle"}
        </p>
        
        <Button
          variant="destructive"
          size="sm"
          onClick={clearAnnotations}
          className="flex items-center mt-3"
        >
          <Trash className="w-4 h-4 mr-2" />
          Clear All Annotations
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="brushSize">Line Thickness: {toolState.brushSize}px</Label>
          <Input
            id="brushSizeInput"
            type="number"
            value={toolState.brushSize}
            onChange={(e) => setBrushSize(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 h-8"
            min={1}
            max={10}
          />
        </div>
        <Slider
          id="brushSize"
          min={1}
          max={10}
          step={1}
          value={[toolState.brushSize]}
          onValueChange={(vals) => setBrushSize(vals[0])}
        />
      </div>
    </div>
  );
};