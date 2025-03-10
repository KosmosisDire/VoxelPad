// src/components/grid/BrushPreview.tsx
import React from 'react';

interface BrushPreviewProps {
  x: number;  // Global grid x-coordinate (float)
  y: number;  // Global grid y-coordinate (float)
  brushSize: number;
  cellSize: number;
  color: string;
  isEraser?: boolean;
  gridSize?: number; // Optional to check bounds
  chunkSize?: number; // Optional to check bounds
}

export const BrushPreview: React.FC<BrushPreviewProps> = ({
  x,
  y,
  brushSize,
  cellSize,
  color,
  isEraser = false,
  gridSize = Infinity,
  chunkSize = Infinity
}) => {
  // Calculate start position based on brush size
  let startX, startY;
  
  if (brushSize % 2 === 0) {
    // Even-sized brush (2×2, 4×4): offset by 0.5 to center on intersection
    startX = Math.floor(x + 0.5 - brushSize/2);
    startY = Math.floor(y + 0.5 - brushSize/2);
  } else {
    // Odd-sized brush (1×1, 3×3, 5×5): center on voxel
    startX = Math.floor(Math.ceil(x) - brushSize/2);
    startY = Math.floor(Math.ceil(y) - brushSize/2);
  }
  
  const cells = [];
  const maxCoord = gridSize * chunkSize;
  
  // Generate exactly brushSize×brushSize cells
  for (let dy = 0; dy < brushSize; dy++) {
    for (let dx = 0; dx < brushSize; dx++) {
      const voxelX = startX + dx;
      const voxelY = startY + dy;
      
      // Skip if outside grid bounds
      if (voxelX < 0 || voxelY < 0 || voxelX >= maxCoord || voxelY >= maxCoord) {
        continue;
      }
      
      cells.push(
        <div
          key={`${dx}-${dy}`}
          className="absolute pointer-events-none"
          style={{
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            left: `${voxelX * cellSize}px`,
            top: `${voxelY * cellSize}px`,
            border: `1px solid ${isEraser ? '#EF4444' : '#FFFFFF'}`,
            backgroundColor: isEraser ? 'rgba(239, 68, 68, 0.2)' : `${color}40`, // 25% opacity
          }}
        />
      );
    }
  }
  
  return <>{cells}</>;
};