// src/components/tools/VoxelTools.tsx
import React from 'react';
import { useToolContext } from '../../context/ToolContext';
import { ToolType } from '../../types/tools';
import { Label } from '@/components/ui/label';

export const VoxelTools: React.FC = () => {
  const { toolState } = useToolContext();
  
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-medium">Voxel Tool</Label>
        <p className="text-sm text-gray-400 mt-1">
          {toolState.activeTool === ToolType.VOXEL_PLACE 
            ? "Left-click or drag to place voxels" 
            : "Left-click or drag to erase voxels"}
        </p>
        
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