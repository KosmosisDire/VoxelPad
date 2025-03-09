// src/context/GridContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    GridData,
    Chunk,
    Position,
    GridConfig,
    positionToKey
} from '../types/grid';

interface GridContextProps {
    gridData: GridData;
    gridConfig: GridConfig;
    setGridConfig: (config: Partial<GridConfig>) => void;
    placeVoxel: (chunkPos: Position, voxelPos: Position, color: string) => void;
    removeVoxel: (chunkPos: Position, voxelPos: Position) => void;
    clearGrid: () => void;
    resetGrid: () => void;
}

const GridContext = createContext<GridContextProps | undefined>(undefined);

export const useGridContext = () => {
    const context = useContext(GridContext);
    if (!context) {
        throw new Error('useGridContext must be used within a GridProvider');
    }
    return context;
};

export const GridProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [gridData, setGridData] = useState<GridData>(new Map());
    const [gridConfig, setGridConfigState] = useState<GridConfig>({
        gridSize: 4, // Number of chunks in each dimension
        chunkSize: 8, // Number of voxels in each chunk dimension
        cellSize: 30, // Size of each voxel in pixels
    });

    // Initialize the grid
    useEffect(() => {
        resetGrid();
    }, [gridConfig.gridSize, gridConfig.chunkSize]);

    const setGridConfig = useCallback((config: Partial<GridConfig>) => {
        setGridConfigState(prev => ({ ...prev, ...config }));
    }, []);

    const resetGrid = useCallback(() => {
        const newGridData = new Map<string, Chunk>();

        for (let cx = 0; cx < gridConfig.gridSize; cx++) {
            for (let cy = 0; cy < gridConfig.gridSize; cy++) {
                const chunkPos = { x: cx, y: cy };
                const chunkKey = positionToKey(chunkPos);

                newGridData.set(chunkKey, {
                    position: chunkPos,
                    voxels: new Map(),
                    size: gridConfig.chunkSize,
                });
            }
        }

        setGridData(newGridData);
    }, [gridConfig.gridSize, gridConfig.chunkSize]);

    const clearGrid = useCallback(() => {
        const clearedGrid = new Map(gridData);

        clearedGrid.forEach((chunk, key) => {
            clearedGrid.set(key, {
                ...chunk,
                voxels: new Map(),
            });
        });

        setGridData(clearedGrid);
    }, [gridData]);

    const placeVoxel = useCallback((chunkPos: Position, voxelPos: Position, color: string) => {
        const chunkKey = positionToKey(chunkPos);
        const voxelKey = positionToKey(voxelPos);

        setGridData(prev => {
            const newGridData = new Map(prev);
            const chunk = newGridData.get(chunkKey);

            if (chunk) {
                const newVoxels = new Map(chunk.voxels);
                newVoxels.set(voxelKey, {
                    position: voxelPos,
                    color,
                    id: uuidv4(),
                });

                newGridData.set(chunkKey, {
                    ...chunk,
                    voxels: newVoxels,
                });
            }

            return newGridData;
        });
    }, []);

    const removeVoxel = useCallback((chunkPos: Position, voxelPos: Position) => {
        const chunkKey = positionToKey(chunkPos);
        const voxelKey = positionToKey(voxelPos);

        setGridData(prev => {
            const newGridData = new Map(prev);
            const chunk = newGridData.get(chunkKey);

            if (chunk && chunk.voxels.has(voxelKey)) {
                const newVoxels = new Map(chunk.voxels);
                newVoxels.delete(voxelKey);

                newGridData.set(chunkKey, {
                    ...chunk,
                    voxels: newVoxels,
                });
            }

            return newGridData;
        });
    }, []);

    return (
        <GridContext.Provider
            value={{
                gridData,
                gridConfig,
                setGridConfig,
                placeVoxel,
                removeVoxel,
                clearGrid,
                resetGrid,
            }}
        >
            {children}
        </GridContext.Provider>
    );
};