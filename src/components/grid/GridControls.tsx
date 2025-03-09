
// src/components/grid/GridControls.tsx
import React from 'react';
import { useGrid } from '../../hooks/useGrid';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

export const GridControls: React.FC = () => {
    const { gridConfig, setGridConfig, resetGrid, clearGrid } = useGrid();

    const handleGridSizeChange = (value: number) => {
        setGridConfig({ gridSize: Math.max(1, value) });
    };

    const handleChunkSizeChange = (value: number) => {
        setGridConfig({ chunkSize: Math.max(1, value) });
    };

    const handleCellSizeChange = (value: number) => {
        setGridConfig({ cellSize: Math.max(5, value) });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Grid Configuration</h3>
                <p className="text-sm text-gray-400">Adjust the grid hierarchy and size</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="gridSize">Grid Size: {gridConfig.gridSize}×{gridConfig.gridSize} chunks</Label>
                        <Input
                            id="gridSizeInput"
                            type="number"
                            value={gridConfig.gridSize}
                            onChange={(e) => handleGridSizeChange(parseInt(e.target.value) || 1)}
                            className="w-16 h-8"
                            min={1}
                            max={10}
                        />
                    </div>
                    <Slider
                        id="gridSize"
                        min={1}
                        max={10}
                        step={1}
                        value={[gridConfig.gridSize]}
                        onValueChange={(vals) => handleGridSizeChange(vals[0])}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="chunkSize">Chunk Size: {gridConfig.chunkSize}×{gridConfig.chunkSize} voxels</Label>
                        <Input
                            id="chunkSizeInput"
                            type="number"
                            value={gridConfig.chunkSize}
                            onChange={(e) => handleChunkSizeChange(parseInt(e.target.value) || 1)}
                            className="w-16 h-8"
                            min={1}
                            max={32}
                        />
                    </div>
                    <Slider
                        id="chunkSize"
                        min={1}
                        max={32}
                        step={1}
                        value={[gridConfig.chunkSize]}
                        onValueChange={(vals) => handleChunkSizeChange(vals[0])}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="cellSize">Cell Size: {gridConfig.cellSize}px</Label>
                        <Input
                            id="cellSizeInput"
                            type="number"
                            value={gridConfig.cellSize}
                            onChange={(e) => handleCellSizeChange(parseInt(e.target.value) || 5)}
                            className="w-16 h-8"
                            min={5}
                            max={50}
                        />
                    </div>
                    <Slider
                        id="cellSize"
                        min={5}
                        max={50}
                        step={1}
                        value={[gridConfig.cellSize]}
                        onValueChange={(vals) => handleCellSizeChange(vals[0])}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-sm text-gray-400">Total grid: {gridConfig.gridSize * gridConfig.chunkSize}×{gridConfig.gridSize * gridConfig.chunkSize} voxels</div>
                <div className="flex space-x-2">
                    <Button variant="secondary" onClick={resetGrid}>
                        Reset Grid
                    </Button>
                    <Button variant="destructive" onClick={clearGrid}>
                        Clear Grid
                    </Button>
                </div>
            </div>
        </div>
    );
};