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
            ? "Click or drag to place voxels" 
            : "Click or drag to erase voxels"}
        </p>
      </div>
    </div>
  );
};