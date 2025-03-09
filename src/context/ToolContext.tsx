
// src/context/ToolContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ToolType, ToolState, Annotation } from '../types/tools';
import { Position } from '../types/grid';

interface ToolContextProps {
    toolState: ToolState;
    setActiveTool: (tool: ToolType) => void;
    setActiveColor: (color: string) => void;
    setBrushSize: (size: number) => void;
    startAnnotation: (type: ToolType, startPoint: Position) => void;
    updateAnnotation: (point: Position) => void;
    endAnnotation: () => void;
    removeAnnotation: (id: string) => void;
    clearAnnotations: () => void;
}

const ToolContext = createContext<ToolContextProps | undefined>(undefined);

export const useToolContext = () => {
    const context = useContext(ToolContext);
    if (!context) {
        throw new Error('useToolContext must be used within a ToolProvider');
    }
    return context;
};

export const ToolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toolState, setToolState] = useState<ToolState>({
        activeTool: ToolType.VOXEL_PLACE,
        activeColor: '#3B82F6', // Default blue color
        brushSize: 1,
        annotations: [],
    });

    const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);

    const setActiveTool = useCallback((tool: ToolType) => {
        setToolState(prev => ({ ...prev, activeTool: tool }));
    }, []);

    const setActiveColor = useCallback((color: string) => {
        setToolState(prev => ({ ...prev, activeColor: color }));
    }, []);

    const setBrushSize = useCallback((size: number) => {
        setToolState(prev => ({ ...prev, brushSize: size }));
    }, []);

    const startAnnotation = useCallback((type: ToolType, startPoint: Position) => {
        if (type === ToolType.VOXEL_PLACE || type === ToolType.ERASER) return;

        const newAnnotation: Annotation = {
            id: uuidv4(),
            type,
            points: [startPoint],
            color: toolState.activeColor,
            thickness: toolState.brushSize,
        };

        setCurrentAnnotation(newAnnotation);
    }, [toolState.activeColor, toolState.brushSize]);

    const updateAnnotation = useCallback((point: Position) => {
        if (!currentAnnotation) return;

        setCurrentAnnotation(prev => {
            if (!prev) return null;

            return {
                ...prev,
                points: [...prev.points, point],
            };
        });
    }, [currentAnnotation]);

    const endAnnotation = useCallback(() => {
        if (!currentAnnotation) return;

        setToolState(prev => ({
            ...prev,
            annotations: [...prev.annotations, currentAnnotation],
        }));

        setCurrentAnnotation(null);
    }, [currentAnnotation]);

    const removeAnnotation = useCallback((id: string) => {
        setToolState(prev => ({
            ...prev,
            annotations: prev.annotations.filter(a => a.id !== id),
        }));
    }, []);

    const clearAnnotations = useCallback(() => {
        setToolState(prev => ({
            ...prev,
            annotations: [],
        }));
    }, []);

    return (
        <ToolContext.Provider
            value={{
                toolState,
                setActiveTool,
                setActiveColor,
                setBrushSize,
                startAnnotation,
                updateAnnotation,
                endAnnotation,
                removeAnnotation,
                clearAnnotations,
            }}
        >
            {children}
        </ToolContext.Provider>
    );
};