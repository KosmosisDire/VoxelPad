// src/components/grid/GridLines.tsx (Updated)
import React from 'react';

interface GridLinesProps {
  width: number;
  height: number;
  gridSize: number;
  chunkSize: number;
  cellSize: number;
  showChunkBorders: boolean;
}

export const GridLines: React.FC<GridLinesProps> = ({
  width,
  height,
  gridSize,
  chunkSize,
  cellSize,
  showChunkBorders,
}) => {
  const totalCells = gridSize * chunkSize;
  const lines = [];
  
  // Draw vertical lines
  for (let i = 0; i <= totalCells; i++) {
    const x = i * cellSize;
    const isChunkBorder = i % chunkSize === 0;
    
    lines.push(
      <line
        key={`v-${i}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke={isChunkBorder && showChunkBorders ? "hsl(var(--border))" : "hsl(var(--muted))"}
        strokeWidth={isChunkBorder ? 1 : 0.5}
        strokeOpacity={isChunkBorder ? 0.8 : 0.4}
        vectorEffect="non-scaling-stroke"
      />
    );
  }
  
  // Draw horizontal lines
  for (let i = 0; i <= totalCells; i++) {
    const y = i * cellSize;
    const isChunkBorder = i % chunkSize === 0;
    
    lines.push(
      <line
        key={`h-${i}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke={isChunkBorder && showChunkBorders ? "hsl(var(--border))" : "hsl(var(--muted))"}
        strokeWidth={isChunkBorder ? 1 : 0.5}
        strokeOpacity={isChunkBorder ? 0.8 : 0.4}
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  return (
    <g className="grid-lines">
      {lines}
    </g>
  );
};
