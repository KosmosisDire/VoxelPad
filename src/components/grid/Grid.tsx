// src/components/grid/Grid.tsx
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useGrid } from '../../hooks/useGrid';
import { useTools } from '../../hooks/useTools';
import { Chunk } from './Chunk';
import { Annotation, ToolType } from '../../types/tools';
import { Move } from 'lucide-react';
import { GridLines } from './GridLines';

interface GridProps {
  showChunkBorders?: boolean;
  showGrid?: boolean;
}

export const Grid: React.FC<GridProps> = ({ 
  showChunkBorders = true,
  showGrid = true,
  sidebarWidth = 0,
  toolSettingsWidth = 0
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const { gridData, gridConfig, getTotalGridSizeInPixels } = useGrid();
  const { toolState, handleMouseDown, handleMouseMove, handleMouseUp } = useTools();
  
  const { width, height } = getTotalGridSizeInPixels();

  // Initialize centered grid on mount and when grid size changes
  useEffect(() => {
    if (gridContainerRef.current) {
      const containerRect = gridContainerRef.current.getBoundingClientRect();
      
      // Calculate the center position
      const centerX = (containerRect.width - width * zoom) / 2;
      const centerY = (containerRect.height - height * zoom) / 2;
      
      // Apply the centering with some adjustments for sidebars
      const sidebarAdjustment = sidebarWidth * 16 / 2; // Convert rem to pixels (assuming 1rem = 16px)
      const toolSettingsAdjustment = toolSettingsWidth * 16 / 2;
      
      setPan({ 
        x: centerX - sidebarAdjustment + toolSettingsAdjustment, 
        y: centerY 
      });
    }
  }, [width, height, gridConfig.gridSize, gridConfig.chunkSize, sidebarWidth, toolSettingsWidth]);

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
    
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [zoom, pan]);
  
  // Convert screen coordinates to grid coordinates considering zoom and pan
  const screenToGridCoordinates = useCallback((screenX: number, screenY: number) => {
    const gridX = (screenX - pan.x) / zoom;
    const gridY = (screenY - pan.y) / zoom;
    return { x: gridX, y: gridY };
  }, [zoom, pan]);
  
  // Handle mouse events on the grid
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
    
    // For other tools, convert to grid coordinates
    const { x, y } = screenToGridCoordinates(screenX, screenY);
    
    setIsMouseDown(true);
    handleMouseDown(x, y);
  }, [pan, zoom, toolState.activeTool, handleMouseDown, screenToGridCoordinates]);
  
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
    
    // For other tools, convert to grid coordinates
    if (isMouseDown) {
      const { x, y } = screenToGridCoordinates(screenX, screenY);
      handleMouseMove(x, y, true);
    }
  }, [isMouseDown, isPanning, panStart, pan, zoom, handleMouseMove, screenToGridCoordinates]);
  
  const onMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
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
  }, [isMouseDown, isPanning, handleMouseUp]);
  
  const onMouseLeave = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isPanning) {
      setIsPanning(false);
    }
    
    if (isMouseDown) {
      setIsMouseDown(false);
      handleMouseUp();
    }
  }, [isMouseDown, isPanning, handleMouseUp]);
  
  // Prevent drag start event
  const onDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    return false;
  }, []);
  
  // Reset zoom and pan
  const resetView = useCallback(() => {
    setZoom(1);
    
    // Center the grid
    if (gridContainerRef.current) {
      const containerRect = gridContainerRef.current.getBoundingClientRect();
      
      // Calculate the center position
      const centerX = (containerRect.width - width) / 2;
      const centerY = (containerRect.height - height) / 2;
      
      // Apply the centering with some adjustments for sidebars
      const sidebarAdjustment = sidebarWidth * 16 / 2; // Convert rem to pixels (assuming 1rem = 16px)
      const toolSettingsAdjustment = toolSettingsWidth * 16 / 2;
      
      setPan({ 
        x: centerX - sidebarAdjustment + toolSettingsAdjustment, 
        y: centerY 
      });
    }
  }, [width, height, sidebarWidth, toolSettingsWidth]);
  
  // Add document-level event listeners for mouse up
  useEffect(() => {
    const handleGlobalMouseUp = () => {
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
  }, [isMouseDown, isPanning, handleMouseUp]);

  // Render grid lines
  const gridLines = useMemo(() => {
    if (!showGrid) return null;
    
    const { gridSize, chunkSize, cellSize } = gridConfig;
    const totalVoxels = gridSize * chunkSize;
    const lines = [];
    
    // Vertical lines
    for (let i = 0; i <= totalVoxels; i++) {
      const position = i * cellSize;
      const isChunkBoundary = i % chunkSize === 0;
      
      lines.push(
        <line
          key={`v-${i}`}
          x1={position}
          y1={0}
          x2={position}
          y2={height}
          stroke={isChunkBoundary ? "#4B5563" : "#1F2937"}
          strokeWidth={isChunkBoundary ? 2 : 1}
        />
      );
    }
    
    // Horizontal lines
    for (let i = 0; i <= totalVoxels; i++) {
      const position = i * cellSize;
      const isChunkBoundary = i % chunkSize === 0;
      
      lines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={position}
          x2={width}
          y2={height}
          stroke={isChunkBoundary ? "#4B5563" : "#1F2937"}
          strokeWidth={isChunkBoundary ? 2 : 1}
        />
      );
    }
    
    return lines;
  }, [gridConfig, width, height, showGrid]);

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
    return [...toolState.annotations].map(renderAnnotation);
  }, [toolState.annotations]);

  // Show pan cursor if in pan mode
  const gridCursor = useMemo(() => {
    if (toolState.activeTool === ToolType.PAN) return 'cursor-grab';
    if (isPanning) return 'cursor-grabbing';
    return 'cursor-default';
  }, [toolState.activeTool, isPanning]);
  
  // Zoom info display
  const zoomPercentage = Math.round(zoom * 100);

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
      
      {/* Pan tool indicator */}
      {toolState.activeTool === ToolType.PAN && (
        <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-70 p-1.5 rounded-md">
          <Move className="w-4 h-4 text-white opacity-70" />
        </div>
      )}
    </div>
  );
};