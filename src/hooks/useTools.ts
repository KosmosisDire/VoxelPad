
// src/hooks/useTools.ts
import { useCallback } from 'react';
import { useToolContext } from '../context/ToolContext';
import { ToolType } from '../types/tools';
import { useGrid } from './useGrid';

export const useTools = () => {
    const {
        toolState,
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
    const handleMouseDown = useCallback((screenX: number, screenY: number) => {
        const { activeTool, activeColor } = toolState;

        // Handle voxel placement or erasing
        if (activeTool === ToolType.VOXEL_PLACE || activeTool === ToolType.ERASER) {
            const { chunkPos, voxelPos } = screenToGridCoords(screenX, screenY);

            if (activeTool === ToolType.VOXEL_PLACE) {
                placeVoxel(chunkPos, voxelPos, activeColor);
            } else {
                removeVoxel(chunkPos, voxelPos);
            }
        }
        // Handle annotation tools
        else {
            startAnnotation(activeTool, { x: screenX, y: screenY });
        }
    }, [toolState, screenToGridCoords, placeVoxel, removeVoxel, startAnnotation]);

    // Handle mouse move on the grid
    const handleMouseMove = useCallback((screenX: number, screenY: number, isMouseDown: boolean) => {
        const { activeTool, activeColor } = toolState;

        if (!isMouseDown) return;

        // Handle continuous voxel placement or erasing
        if (activeTool === ToolType.VOXEL_PLACE || activeTool === ToolType.ERASER) {
            const { chunkPos, voxelPos } = screenToGridCoords(screenX, screenY);

            if (activeTool === ToolType.VOXEL_PLACE) {
                placeVoxel(chunkPos, voxelPos, activeColor);
            } else {
                removeVoxel(chunkPos, voxelPos);
            }
        }
        // Update annotation while drawing
        else {
            updateAnnotation({ x: screenX, y: screenY });
        }
    }, [toolState, screenToGridCoords, placeVoxel, removeVoxel, updateAnnotation]);

    // Handle mouse up on the grid
    const handleMouseUp = useCallback(() => {
        const { activeTool } = toolState;

        if (activeTool !== ToolType.VOXEL_PLACE && activeTool !== ToolType.ERASER) {
            endAnnotation();
        }
    }, [toolState, endAnnotation]);

    return {
        toolState,
        setActiveTool,
        setActiveColor,
        setBrushSize,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        removeAnnotation,
        clearAnnotations,
    };
};