// src/components/grid/Voxel.tsx
import React from 'react';
import { VoxelData } from '../../types/grid';

interface VoxelProps {
  voxel: VoxelData;
  size: number;
}

export const Voxel: React.FC<VoxelProps> = ({ voxel, size }) => {
  // Prevent any dragging behavior
  const preventDrag = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };
  
  return (
    <div
      className="absolute border border-gray-700 select-none"
      style={{
        backgroundColor: voxel.color,
        width: `${size}px`,
        height: `${size}px`,
        left: `${voxel.position.x * size}px`,
        top: `${voxel.position.y * size}px`,
        userSelect: 'none',
      }}
      draggable={false}
      onDragStart={preventDrag}
    />
  );
};