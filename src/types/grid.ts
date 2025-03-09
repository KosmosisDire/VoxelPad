// src/types/grid.ts
export interface Position {
  x: number;
  y: number;
}

export interface VoxelData {
  position: Position;
  color: string;
  id: string;
}

export interface Chunk {
  position: Position;
  voxels: Map<string, VoxelData>;
  size: number;
}

export interface GridConfig {
  gridSize: number;
  chunkSize: number;
  cellSize: number;
}

export type GridData = Map<string, Chunk>;

// Helper functions for grid coordinates
export const positionToKey = (pos: Position): string => `${pos.x},${pos.y}`;
export const keyToPosition = (key: string): Position => {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
};
