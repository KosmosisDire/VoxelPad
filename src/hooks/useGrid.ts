// src/hooks/useGrid.ts
import { useCallback } from 'react';
import { useGridContext } from '../context/GridContext';
import { Position } from '../types/grid';

export const useGrid = () => {
  const {
    gridData,
    gridConfig,
    setGridConfig,
    placeVoxel,
    removeVoxel,
    clearGrid,
    resetGrid,
    startBatch,
    endBatch,
    isInBatch
  } = useGridContext();

  // Convert grid coordinates to screen coordinates
  const gridToScreenCoords = useCallback((chunkPos: Position, voxelPos: Position): Position => {
    const { cellSize, chunkSize } = gridConfig;
    return {
      x: (chunkPos.x * chunkSize + voxelPos.x) * cellSize,
      y: (chunkPos.y * chunkSize + voxelPos.y) * cellSize,
    };
  }, [gridConfig]);

  // Convert screen coordinates to grid coordinates
  const screenToGridCoords = useCallback((screenX: number, screenY: number): { chunkPos: Position, voxelPos: Position } => {
    const { cellSize, chunkSize } = gridConfig;
    
    const globalVoxelX = Math.floor(screenX / cellSize);
    const globalVoxelY = Math.floor(screenY / cellSize);
    
    const chunkX = Math.floor(globalVoxelX / chunkSize);
    const chunkY = Math.floor(globalVoxelY / chunkSize);
    
    const voxelX = globalVoxelX % chunkSize;
    const voxelY = globalVoxelY % chunkSize;
    
    return {
      chunkPos: { x: chunkX, y: chunkY },
      voxelPos: { x: voxelX, y: voxelY },
    };
  }, [gridConfig]);

  // Get the total size of the grid in pixels
  const getTotalGridSizeInPixels = useCallback((): { width: number, height: number } => {
    const { gridSize, chunkSize, cellSize } = gridConfig;
    const totalSize = gridSize * chunkSize * cellSize;
    return { width: totalSize, height: totalSize };
  }, [gridConfig]);

  return {
    gridData,
    gridConfig,
    setGridConfig,
    placeVoxel,
    removeVoxel,
    clearGrid,
    resetGrid,
    gridToScreenCoords,
    screenToGridCoords,
    getTotalGridSizeInPixels,
    startBatch,
    endBatch,
    isInBatch
  };
};