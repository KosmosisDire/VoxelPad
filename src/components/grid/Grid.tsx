// src/components/grid/Grid.tsx
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useGrid } from '../../hooks/useGrid';
import { useTools } from '../../hooks/useTools';
import { Chunk } from './Chunk';
import { Annotation, ToolType } from '../../types/tools';
import { Move } from 'lucide-react';
import { GridLines } from './GridLines';
import { BrushPreview } from './BrushPreview';

interface GridProps {
    showChunkBorders?: boolean;
    showGrid?: boolean;
    sidebarOpen?: boolean;
    toolSettingsOpen?: boolean;
}

export const Grid: React.FC<GridProps> = ({
    showChunkBorders = true,
    showGrid = true,
    sidebarOpen = true,
    toolSettingsOpen = true
}) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [initialCentering, setInitialCentering] = useState(false);
    const [globalMousePos, setGlobalMousePos] = useState<{ x: number, y: number } | null>(null);
    const [showBrushPreview, setShowBrushPreview] = useState(false);

    const {
        gridData,
        gridConfig,
        getTotalGridSizeInPixels,
        startBatch,
        endBatch,
        isInBatch,
        screenToGridCoords
    } = useGrid();

    const {
        toolState,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        currentAnnotation
    } = useTools();

    const { width, height } = getTotalGridSizeInPixels();

    // Center the grid based on current dimensions and sidebar states
    const centerGrid = useCallback(() => {
        if (!gridContainerRef.current) return;

        const containerRect = gridContainerRef.current.getBoundingClientRect();

        // Calculate the center position
        const centerX = (containerRect.width - width * zoom) / 2;
        const centerY = (containerRect.height - height * zoom) / 2;

        // Update pan position without triggering useEffect
        setPan({ x: centerX, y: centerY });
    }, [width, height]);

    // Initial centering when component mounts
    useEffect(() => {
        if (!initialCentering && gridContainerRef.current) {
            centerGrid();
            setInitialCentering(true);
        }
    }, [centerGrid, initialCentering]);

    // Update position when sidebar states change
    useEffect(() => {
        if (initialCentering) {
            // Only recenter when grid/chunk size changes or sidebars change
            // This is a separate effect from the zoom-based panning
            centerGrid();
        }
    }, [sidebarOpen, toolSettingsOpen, gridConfig.gridSize, gridConfig.chunkSize, centerGrid, initialCentering]);


    // Convert chunk Map to array for rendering
    const chunks = useMemo(() => {
        return Array.from(gridData.values());
    }, [gridData]);

    // Handle zooming with mouse wheel
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();

        const delta = e.deltaY * -0.001;
        const newZoom = Math.min(Math.max(zoom + delta, 0.1), 5);

        // Get mouse position relative to the grid container
        const containerRect = gridContainerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;

        // Calculate the point in the original coordinate system
        const pointXBeforeZoom = (mouseX - pan.x) / zoom;
        const pointYBeforeZoom = (mouseY - pan.y) / zoom;

        // Calculate the point in the new coordinate system
        const pointXAfterZoom = pointXBeforeZoom * newZoom;
        const pointYAfterZoom = pointYBeforeZoom * newZoom;

        // Adjust pan to keep the point under the mouse
        const newPanX = mouseX - pointXAfterZoom;
        const newPanY = mouseY - pointYAfterZoom;

        // Update without triggering a recenter
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
    }, [zoom, pan]);

    // Convert screen coordinates to grid coordinates considering zoom and pan
    const screenToGridCoordinates = useCallback((screenX: number, screenY: number) => {
        const gridX = (screenX - pan.x) / zoom;
        const gridY = (screenY - pan.y) / zoom;
        return { x: gridX, y: gridY };
    }, [zoom, pan]);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();

        if (!gridContainerRef.current) return;

        const containerRect = gridContainerRef.current.getBoundingClientRect();
        const screenX = e.clientX - containerRect.left;
        const screenY = e.clientY - containerRect.top;

        // Handle middle mouse button or pan tool for panning
        if (e.button === 1 || toolState.activeTool === ToolType.PAN) {
            setIsPanning(true);
            setPanStart({ x: screenX - pan.x, y: screenY - pan.y });
            return;
        }

        // Start a batch operation for ALL voxel tools (both place and erase)
        // Do this BEFORE calling handleMouseDown to ensure first voxel is in the batch
        if (toolState.activeTool === ToolType.VOXEL_PLACE || toolState.activeTool === ToolType.ERASER) {
            console.log("Starting batch on mouse down");
            startBatch();
        }

        // For all tools, convert to grid coordinates
        const { x, y } = screenToGridCoordinates(screenX, screenY);

        setIsMouseDown(true);

        // Handle right-click to use opposite tool
        if (e.button === 2) {
            // If current tool is VOXEL_PLACE, use ERASER
            if (toolState.activeTool === ToolType.VOXEL_PLACE) {
                handleMouseDown(x, y, ToolType.ERASER);
            }
            // If current tool is ERASER, use VOXEL_PLACE
            else if (toolState.activeTool === ToolType.ERASER) {
                handleMouseDown(x, y, ToolType.VOXEL_PLACE);
            }
            // For other tools, use the current tool
            else {
                handleMouseDown(x, y);
            }
        } else {
            // Normal left-click uses the current tool
            handleMouseDown(x, y);
        }
    }, [pan, zoom, toolState.activeTool, handleMouseDown, screenToGridCoordinates, startBatch]);

    const onMouseUp = useCallback((e: React.MouseEvent) => {
        e.preventDefault();

        // End batch if we were in a voxel operation
        // Check both isInBatch and toolState to make sure we don't miss any batches
        if (isInBatch ||
            toolState.activeTool === ToolType.VOXEL_PLACE ||
            toolState.activeTool === ToolType.ERASER) {
            console.log("Ending batch on mouse up");
            endBatch();
        }

        // End panning if we were panning
        if (isPanning) {
            setIsPanning(false);
            return;
        }

        // For other tools
        if (isMouseDown) {
            setIsMouseDown(false);
            handleMouseUp();
        }
    }, [isMouseDown, isPanning, handleMouseUp, isInBatch, endBatch, toolState.activeTool]);

    const onMouseLeave = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setShowBrushPreview(false);

        // End batch if we were in a voxel operation
        // Check both isInBatch and toolState to make sure we don't miss any batches
        if (isInBatch ||
            toolState.activeTool === ToolType.VOXEL_PLACE ||
            toolState.activeTool === ToolType.ERASER) {
            console.log("Ending batch on mouse leave");
            endBatch();
        }

        if (isPanning) {
            setIsPanning(false);
        }

        if (isMouseDown) {
            setIsMouseDown(false);
            handleMouseUp();
        }
    }, [isMouseDown, isPanning, handleMouseUp, isInBatch, endBatch, toolState.activeTool]);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        e.preventDefault();

        if (!gridContainerRef.current) return;

        const containerRect = gridContainerRef.current.getBoundingClientRect();
        const screenX = e.clientX - containerRect.left;
        const screenY = e.clientY - containerRect.top;

        // Handle panning
        if (isPanning) {
            setPan({
                x: screenX - panStart.x,
                y: screenY - panStart.y
            });
            return;
        }

        // Get the exact floating-point grid coordinates
        const { x, y } = screenToGridCoordinates(screenX, screenY);
        let cellx = (x / gridConfig.cellSize);
        let celly = (y / gridConfig.cellSize);
        setGlobalMousePos({ x: cellx, y: celly });

        // Show brush preview for voxel tools
        setShowBrushPreview(
            (toolState.activeTool === ToolType.VOXEL_PLACE || toolState.activeTool === ToolType.ERASER) &&
            !isPanning
        );

        // For other tools, convert to grid coordinates
        if (isMouseDown) {
            // Handle right-click to use opposite tool
            if (e.buttons === 2) {
                // If current tool is VOXEL_PLACE, use ERASER
                if (toolState.activeTool === ToolType.VOXEL_PLACE) {
                    handleMouseMove(x, y, true, ToolType.ERASER);
                }
                // If current tool is ERASER, use VOXEL_PLACE
                else if (toolState.activeTool === ToolType.ERASER) {
                    handleMouseMove(x, y, true, ToolType.VOXEL_PLACE);
                }
                // For other tools, use the current tool
                else {
                    handleMouseMove(x, y, true);
                }
            } else {
                // Normal left-click drag uses the current tool
                handleMouseMove(x, y, true);
            }
        }
    }, [
        isMouseDown,
        isPanning,
        panStart,
        pan,
        zoom,
        toolState.activeTool,
        handleMouseMove,
        screenToGridCoordinates,
        screenToGridCoords,
        gridConfig.chunkSize
    ]);

    // Prevent drag start event
    const onDragStart = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        return false;
    }, []);

    // Reset zoom and pan
    const resetView = useCallback(() => {
        setZoom(1);
        centerGrid();
    }, [centerGrid]);

    // Add document-level event listeners for mouse up
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            // Always end any active batch operation first
            if (isInBatch ||
                toolState.activeTool === ToolType.VOXEL_PLACE ||
                toolState.activeTool === ToolType.ERASER) {
                console.log("Ending batch on global mouse up");
                endBatch();
            }

            // Handle other mouse up actions
            if (isMouseDown) {
                setIsMouseDown(false);
                handleMouseUp();
            }

            if (isPanning) {
                setIsPanning(false);
            }
        };

        document.addEventListener('mouseup', handleGlobalMouseUp);

        return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isMouseDown, isPanning, handleMouseUp, isInBatch, endBatch, toolState.activeTool]);

    // Render annotations
    const renderAnnotation = (annotation: Annotation) => {
        const { id, type, points, color, thickness } = annotation;

        if (points.length < 2) return null;

        const adjustedThickness = thickness / zoom;

        switch (type) {
            case ToolType.LINE:
                return (
                    <line
                        key={id}
                        x1={points[0].x}
                        y1={points[0].y}
                        x2={points[points.length - 1].x}
                        y2={points[points.length - 1].y}
                        stroke={color}
                        strokeWidth={adjustedThickness}
                        vectorEffect="non-scaling-stroke"
                    />
                );

            case ToolType.RECTANGLE: {
                const startPoint = points[0];
                const endPoint = points[points.length - 1];

                const x = Math.min(startPoint.x, endPoint.x);
                const y = Math.min(startPoint.y, endPoint.y);
                const width = Math.abs(endPoint.x - startPoint.x);
                const height = Math.abs(endPoint.y - startPoint.y);

                return (
                    <rect
                        key={id}
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        stroke={color}
                        strokeWidth={adjustedThickness}
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                    />
                );
            }

            case ToolType.FREE_DRAW: {
                let pathData = `M ${points[0].x} ${points[0].y}`;

                for (let i = 1; i < points.length; i++) {
                    pathData += ` L ${points[i].x} ${points[i].y}`;
                }

                return (
                    <path
                        key={id}
                        d={pathData}
                        stroke={color}
                        strokeWidth={adjustedThickness}
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                    />
                );
            }

            default:
                return null;
        }
    };

    // Combine all annotations for rendering
    const annotationElements = useMemo(() => {
        // Get all completed annotations
        const completedAnnotations = [...toolState.annotations].map(renderAnnotation);

        // Add the current annotation being drawn if it exists
        if (currentAnnotation && currentAnnotation.points.length > 1) {
            const currentAnnotationElement = renderAnnotation(currentAnnotation);
            if (currentAnnotationElement) {
                completedAnnotations.push(currentAnnotationElement);
            }
        }

        return completedAnnotations;
    }, [toolState.annotations, currentAnnotation, zoom]);

    // Show pan cursor if in pan mode
    const gridCursor = useMemo(() => {
        if (toolState.activeTool === ToolType.PAN) return 'cursor-grab';
        if (isPanning) return 'cursor-grabbing';
        return 'cursor-default';
    }, [toolState.activeTool, isPanning]);

    // Zoom info display
    const zoomPercentage = Math.round(zoom * 100);

    // Prevent right-click context menu on the grid
    const onContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        return false;
    }, []);

    return (
        <div
            ref={gridContainerRef}
            className={`w-full h-full select-none grid-container ${gridCursor}`}
            style={{
                position: 'relative',
                overflow: 'hidden',
                zIndex: 5  // Ensure it's above some layers but below sidebars
            }}
            onWheel={handleWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onDragStart={onDragStart}
            onContextMenu={onContextMenu}
            draggable={false}
        >
            {/* Zoom info - positioned relative to main content area */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-80 text-white px-2 py-1 rounded text-xs z-10">
                {zoomPercentage}%
                <button
                    className="ml-2 px-1 bg-gray-700 rounded hover:bg-gray-600"
                    onClick={resetView}
                    title="Reset View"
                >
                    Reset
                </button>
            </div>

            {/* Pan tool indicator - repositioned */}
            {toolState.activeTool === ToolType.PAN && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-70 p-1.5 rounded-md">
                    <Move className="w-4 h-4 text-white opacity-70" />
                </div>
            )}

            {/* Grid background that's exactly the size of the grid */}
            <div
                className="absolute"
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                }}
            />

            {/* Grid content with transform */}
            <div
                ref={gridRef}
                className="absolute"
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    userSelect: 'none',
                    WebkitUserDrag: 'none'
                }}
            >
                {/* Chunks and Voxels */}
                {chunks.map(chunk => (
                    <Chunk
                        key={`${chunk.position.x},${chunk.position.y}`}
                        chunk={chunk}
                        cellSize={gridConfig.cellSize}
                        chunkSize={gridConfig.chunkSize}
                        showChunkBorders={showChunkBorders}
                    />
                ))}

                {/* Brush Preview */}
                {showBrushPreview && globalMousePos && (
                    <BrushPreview
                        x={globalMousePos.x}
                        y={globalMousePos.y}
                        brushSize={toolState.brushSize}
                        cellSize={gridConfig.cellSize}
                        color={toolState.activeColor}
                        isEraser={toolState.activeTool === ToolType.ERASER}
                        gridSize={gridConfig.gridSize}
                        chunkSize={gridConfig.chunkSize}
                    />
                )}
                {/* Grid Lines and Annotations */}
                <svg
                    className="absolute top-0 left-0 pointer-events-none"
                    width={width}
                    height={height}
                    style={{ userSelect: 'none' }}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {showGrid && (
                        <GridLines
                            width={width}
                            height={height}
                            gridSize={gridConfig.gridSize}
                            chunkSize={gridConfig.chunkSize}
                            cellSize={gridConfig.cellSize}
                            showChunkBorders={showChunkBorders}
                        />
                    )}
                    <g>{annotationElements}</g>
                </svg>
            </div>

            {/* Pan tool indicator - keep only one instance */}
            {toolState.activeTool === ToolType.PAN && (
                <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-70 p-1.5 rounded-md">
                    <Move className="w-4 h-4 text-white opacity-70" />
                </div>
            )}
        </div>
    );
};