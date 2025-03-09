// src/components/grid/Chunk.tsx
import React, { useMemo } from 'react';
import { Chunk as ChunkType } from '../../types/grid';
import { Voxel } from './Voxel';

interface ChunkProps {
  chunk: ChunkType;
  cellSize: number;
  chunkSize: number;
  showChunkBorders?: boolean;
}

export const Chunk: React.FC<ChunkProps> = ({ 
  chunk, 
  cellSize, 
  chunkSize,
  showChunkBorders = true,
}) => {
  const chunkPixelSize = chunkSize * cellSize;
  
  // Prevent any dragging behavior
  const preventDrag = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };
  
  const voxelElements = useMemo(() => {
    return Array.from(chunk.voxels.values()).map(voxel => (
      <Voxel key={voxel.id} voxel={voxel} size={cellSize} />
    ));
  }, [chunk.voxels, cellSize]);

  return (
    <div
      className={`absolute ${showChunkBorders ? 'border border-gray-500' : ''} select-none`}
      style={{
        width: `${chunkPixelSize}px`,
        height: `${chunkPixelSize}px`,
        left: `${chunk.position.x * chunkPixelSize}px`,
        top: `${chunk.position.y * chunkPixelSize}px`,
        userSelect: 'none',
      }}
      draggable={false}
      onDragStart={preventDrag}
    >
      {voxelElements}
    </div>
  );
};