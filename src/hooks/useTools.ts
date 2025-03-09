// src/hooks/useTools.ts
import { useCallback } from 'react';
import { useToolContext } from '../context/ToolContext';
import { ToolType, Position } from '../types/tools';
import { useGrid } from './useGrid';

export const useTools = () => {
  const {
    toolState,
    currentAnnotation,
    setActiveTool,
    setActiveColor,
    setBrushSize,
    startAnnotation,
    updateAnnotation,
    endAnnotation,
    removeAnnotation,
    clearAnnotations,
  } = useToolContext();
  
  const { placeVoxel, removeVoxel, screenToGridCoords } = useGrid();

  // Handle mouse down on the grid
  const handleMouseDown = useCallback((screenX: number, screenY: number, overrideTool?: ToolType) => {
    const { activeTool, activeColor } = toolState;
    const toolToUse = overrideTool || activeTool;
    
    // Handle voxel placement or erasing
    if (toolToUse === ToolType.VOXEL_PLACE || toolToUse === ToolType.ERASER) {
      const { chunkPos, voxelPos } = screenToGridCoords(screenX, screenY);
      
      if (toolToUse === ToolType.VOXEL_PLACE) {
        placeVoxel(chunkPos, voxelPos, activeColor);
      } else {
        removeVoxel(chunkPos, voxelPos);
      }
    } 
    // Handle annotation tools
    else if (toolToUse !== ToolType.PAN) {
      startAnnotation(toolToUse, { x: screenX, y: screenY });
    }
  }, [toolState, screenToGridCoords, placeVoxel, removeVoxel, startAnnotation]);

  // Handle mouse move on the grid
  const handleMouseMove = useCallback((screenX: number, screenY: number, isMouseDown: boolean, overrideTool?: ToolType) => {
    const { activeTool, activeColor } = toolState;
    const toolToUse = overrideTool || activeTool;
    
    if (!isMouseDown) return;
    
    // Handle continuous voxel placement or erasing
    if (toolToUse === ToolType.VOXEL_PLACE || toolToUse === ToolType.ERASER) {
      const { chunkPos, voxelPos } = screenToGridCoords(screenX, screenY);
      
      if (toolToUse === ToolType.VOXEL_PLACE) {
        placeVoxel(chunkPos, voxelPos, activeColor);
      } else {
        removeVoxel(chunkPos, voxelPos);
      }
    } 
    // Update annotation while drawing
    else if (toolToUse !== ToolType.PAN) {
      updateAnnotation({ x: screenX, y: screenY });
    }
  }, [toolState, screenToGridCoords, placeVoxel, removeVoxel, updateAnnotation]);

  // Handle mouse up on the grid
  const handleMouseUp = useCallback(() => {
    const { activeTool } = toolState;
    
    if (activeTool !== ToolType.VOXEL_PLACE && activeTool !== ToolType.ERASER && activeTool !== ToolType.PAN) {
      endAnnotation();
    }
  }, [toolState, endAnnotation]);

  return {
    toolState,
    currentAnnotation,
    setActiveTool,
    setActiveColor,
    setBrushSize,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    removeAnnotation,
    clearAnnotations
  };
};