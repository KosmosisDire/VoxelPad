// src/hooks/useTools.ts
import { useCallback } from 'react';
import { useToolContext } from '../context/ToolContext';
import { ToolType, Position } from '../types/tools';
import { useGrid } from './useGrid';
import { GridConfig } from '../types/grid';

// Function to get all positions affected by a brush
const getVoxelPositionsForBrush = (
    x: Position,
    y: Position,
    brushSize: number,
    gridConfig: GridConfig
): { chunkPos: Position, voxelPos: Position }[] => {
    const positions: { chunkPos: Position, voxelPos: Position }[] = [];
    const { chunkSize, gridSize } = gridConfig;

    // For even-sized brushes, we need to adjust the centering differently
    let startX, startY;

    if (brushSize % 2 === 0) {
        // Even-sized brush (2×2, 4×4): offset by 0.5 to center on intersection
        startX = Math.floor(x + 0.5 - brushSize / 2);
        startY = Math.floor(y + 0.5 - brushSize / 2);
    } else {
        // Odd-sized brush (1×1, 3×3, 5×5): center on voxel
        startX = Math.floor(Math.ceil(x) - brushSize / 2);
        startY = Math.floor(Math.ceil(y) - brushSize / 2);
    }

    // Track which voxels we've already added (to avoid duplicates)
    const addedPositions = new Set();

    // Generate exactly brushSize×brushSize cells
    for (let dy = 0; dy < brushSize; dy++) {
        for (let dx = 0; dx < brushSize; dx++) {
            const voxelX = startX + dx;
            const voxelY = startY + dy;

            // Skip if outside grid bounds
            const maxCoord = gridSize * chunkSize;
            if (voxelX < 0 || voxelY < 0 || voxelX >= maxCoord || voxelY >= maxCoord) {
                continue;
            }

            // Create a position key to avoid duplicates
            const posKey = `${voxelX},${voxelY}`;
            if (addedPositions.has(posKey)) continue;
            addedPositions.add(posKey);

            // Convert global position back to chunk and voxel coordinates
            const newChunkX = Math.floor(voxelX / chunkSize);
            const newChunkY = Math.floor(voxelY / chunkSize);
            const newVoxelX = voxelX % chunkSize;
            const newVoxelY = voxelY % chunkSize;

            positions.push({
                chunkPos: { x: newChunkX, y: newChunkY },
                voxelPos: { x: newVoxelX, y: newVoxelY }
            });
        }
    }

    return positions;
};

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

    const { placeVoxel, removeVoxel, screenToGridCoords, gridConfig } = useGrid();

    // Handle mouse down on the grid
    const handleMouseDown = useCallback((screenX: number, screenY: number, overrideTool?: ToolType) => {
        const { activeTool, activeColor, brushSize } = toolState;
        const toolToUse = overrideTool || activeTool;

        // Handle voxel placement or erasing
        if (toolToUse === ToolType.VOXEL_PLACE || toolToUse === ToolType.ERASER) {
            const { chunkPos, voxelPos } = screenToGridCoords(screenX, screenY);

            let cellx = screenX / gridConfig.cellSize;
            let celly = screenY / gridConfig.cellSize;
            console.log(cellx, celly);

            if (brushSize === 1) {
                // Single voxel operation
                if (toolToUse === ToolType.VOXEL_PLACE) {
                    placeVoxel(chunkPos, voxelPos, activeColor);
                } else {
                    removeVoxel(chunkPos, voxelPos);
                }
            } else {
                // Multi-voxel operation
                const positions = getVoxelPositionsForBrush(cellx, celly, brushSize, gridConfig);

                for (const pos of positions) {
                    if (toolToUse === ToolType.VOXEL_PLACE) {
                        placeVoxel(pos.chunkPos, pos.voxelPos, activeColor);
                    } else {
                        removeVoxel(pos.chunkPos, pos.voxelPos);
                    }
                }
            }
        }
        // Handle annotation tools
        else if (toolToUse !== ToolType.PAN) {
            startAnnotation(toolToUse, { x: screenX, y: screenY });
        }
    }, [toolState, screenToGridCoords, placeVoxel, removeVoxel, startAnnotation, gridConfig]);

    // Handle mouse move on the grid
    const handleMouseMove = useCallback((screenX: number, screenY: number, isMouseDown: boolean, overrideTool?: ToolType) => {
        const { activeTool, activeColor, brushSize } = toolState;
        const toolToUse = overrideTool || activeTool;

        if (!isMouseDown) return;

        // Handle continuous voxel placement or erasing
        if (toolToUse === ToolType.VOXEL_PLACE || toolToUse === ToolType.ERASER) {
            const { chunkPos, voxelPos } = screenToGridCoords(screenX, screenY);

            let cellx = screenX / gridConfig.cellSize;
            let celly = screenY / gridConfig.cellSize;

            if (brushSize === 1) {
                // Single voxel operation
                if (toolToUse === ToolType.VOXEL_PLACE) {
                    placeVoxel(chunkPos, voxelPos, activeColor);
                } else {
                    removeVoxel(chunkPos, voxelPos);
                }
            } else {
                // Multi-voxel operation
                const positions = getVoxelPositionsForBrush(cellx, celly, brushSize, gridConfig);

                for (const pos of positions) {
                    if (toolToUse === ToolType.VOXEL_PLACE) {
                        placeVoxel(pos.chunkPos, pos.voxelPos, activeColor);
                    } else {
                        removeVoxel(pos.chunkPos, pos.voxelPos);
                    }
                }
            }
        }
        // Update annotation while drawing
        else if (toolToUse !== ToolType.PAN) {
            updateAnnotation({ x: screenX, y: screenY });
        }
    }, [toolState, screenToGridCoords, placeVoxel, removeVoxel, updateAnnotation, gridConfig]);

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