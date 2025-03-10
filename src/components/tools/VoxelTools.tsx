// src/components/tools/VoxelTools.tsx
import React from 'react';
import { useToolContext } from '../../context/ToolContext';
import { ToolType } from '../../types/tools';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

export const VoxelTools: React.FC = () => {
  const { toolState, setBrushSize } = useToolContext();
  
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-medium">Voxel Tool</Label>
        <p className="text-sm text-gray-400 mt-1">
          {toolState.activeTool === ToolType.VOXEL_PLACE 
            ? "Left-click or drag to place voxels" 
            : "Left-click or drag to erase voxels"}
        </p>
        
        {/* Brush Size Control (show for both place and erase tools) */}
        {(toolState.activeTool === ToolType.VOXEL_PLACE || toolState.activeTool === ToolType.ERASER) && (
          <div className="space-y-2 mt-4">
            <div className="flex justify-between">
              <Label htmlFor="brushSize">Brush Size: {toolState.brushSize}×{toolState.brushSize}</Label>
              <Input
                id="brushSizeInput"
                type="number"
                value={toolState.brushSize}
                onChange={(e) => setBrushSize(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 h-8"
                min={1}
                max={5}
              />
            </div>
            <Slider
              id="brushSize"
              min={1}
              max={8}
              step={1}
              value={[toolState.brushSize]}
              onValueChange={(vals) => setBrushSize(vals[0])}
            />
          </div>
        )}
        
        <div className="mt-4 bg-gray-800 p-3 rounded-md">
          <h4 className="text-sm font-medium mb-2">Pro Tip:</h4>
          <p className="text-sm text-gray-400">
            {toolState.activeTool === ToolType.VOXEL_PLACE
              ? "Right-click to erase voxels without switching tools"
              : "Right-click to place voxels without switching tools"}
          </p>
        </div>
      </div>
    </div>
  );
};