// src/context/ToolContext.tsx
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ToolType, ToolState, Annotation, Position } from '../types/tools';
import { useActionContext, ActionType } from './ActionContext';

interface ToolContextProps {
  toolState: ToolState;
  currentAnnotation: Annotation | null;
  setActiveTool: (tool: ToolType) => void;
  setActiveColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  startAnnotation: (type: ToolType, startPoint: Position) => void;
  updateAnnotation: (point: Position) => void;
  endAnnotation: () => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  applyAnnotationAction: (action: any) => void;
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
  
  // Use useRef to avoid the component update during render error
  const actionContextRef = useRef(useActionContext());
  const { recordAction } = actionContextRef.current;

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
    if (type === ToolType.VOXEL_PLACE || type === ToolType.ERASER || type === ToolType.PAN) return;
    
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
    
    const annotationToAdd = currentAnnotation;
    
    setToolState(prev => ({
      ...prev,
      annotations: [...prev.annotations, annotationToAdd],
    }));
    
    setCurrentAnnotation(null);
    
    // Record the add annotation action after state update
    setTimeout(() => {
      recordAction({
        type: ActionType.ANNOTATION_ADD,
        annotation: annotationToAdd
      });
    }, 0);
  }, [currentAnnotation, recordAction]);

  const removeAnnotation = useCallback((id: string) => {
    setToolState(prev => {
      const index = prev.annotations.findIndex(a => a.id === id);
      if (index === -1) return prev;
      
      const annotation = prev.annotations[index];
      const newAnnotations = [...prev.annotations];
      newAnnotations.splice(index, 1);
      
      // Record the remove annotation action after state update
      setTimeout(() => {
        recordAction({
          type: ActionType.ANNOTATION_REMOVE,
          annotation,
          index
        });
      }, 0);
      
      return {
        ...prev,
        annotations: newAnnotations,
      };
    });
  }, [recordAction]);

  const clearAnnotations = useCallback(() => {
    setToolState(prev => {
      if (prev.annotations.length === 0) return prev;
      
      const previousAnnotations = [...prev.annotations];
      
      // Record the clear annotations action after state update
      setTimeout(() => {
        recordAction({
          type: ActionType.ANNOTATION_CLEAR,
          previousAnnotations
        });
      }, 0);
      
      return {
        ...prev,
        annotations: [],
      };
    });
  }, [recordAction]);
  
  // Apply annotation actions from undo/redo operations
  const applyAnnotationAction = useCallback((action: any) => {
    switch (action.type) {
      case ActionType.ANNOTATION_ADD:
        // Remove the added annotation (for undo)
        setToolState(prev => ({
          ...prev,
          annotations: prev.annotations.filter(a => a.id !== action.annotation.id),
        }));
        break;
      
      case ActionType.ANNOTATION_REMOVE:
        // Restore the removed annotation (for undo)
        setToolState(prev => {
          const newAnnotations = [...prev.annotations];
          newAnnotations.splice(action.index, 0, action.annotation);
          
          return {
            ...prev,
            annotations: newAnnotations,
          };
        });
        break;
      
      case ActionType.ANNOTATION_CLEAR:
        // Restore cleared annotations (for undo)
        setToolState(prev => ({
          ...prev,
          annotations: action.previousAnnotations,
        }));
        break;
    }
  }, []);

  // Listen for global action events
  useEffect(() => {
    const handleActionEvent = (e: CustomEvent) => {
      const { action, isRedo } = e.detail;
      console.log("ToolContext received action event:", action.type, isRedo ? "(redo)" : "(undo)");
      
      // Check if this is an annotation action
      if (
        action.type === ActionType.ANNOTATION_ADD ||
        action.type === ActionType.ANNOTATION_REMOVE ||
        action.type === ActionType.ANNOTATION_CLEAR
      ) {
        // Apply the action based on whether it's an undo or redo
        if (isRedo) {
          // For redo, we need to invert the action
          console.log("Applying annotation redo action:", action.type);
          
          switch(action.type) {
            case ActionType.ANNOTATION_ADD:
              // For redo of ANNOTATION_ADD, we need to add the annotation again
              setToolState(prev => ({
                ...prev,
                annotations: [...prev.annotations, action.annotation]
              }));
              break;
              
            case ActionType.ANNOTATION_REMOVE:
              // For redo of ANNOTATION_REMOVE, we need to remove the annotation again
              setToolState(prev => ({
                ...prev,
                annotations: prev.annotations.filter(a => a.id !== action.annotation.id)
              }));
              break;
              
            case ActionType.ANNOTATION_CLEAR:
              // For redo of ANNOTATION_CLEAR, just clear the annotations
              setToolState(prev => ({
                ...prev,
                annotations: []
              }));
              break;
          }
        } else {
          // For undo, just apply the action directly
          console.log("Applying annotation undo action:", action.type);
          applyAnnotationAction(action);
        }
      }
    };
    
    // Add event listener with proper type casting
    document.addEventListener('action:apply', handleActionEvent as EventListener);
    
    return () => {
      document.removeEventListener('action:apply', handleActionEvent as EventListener);
    };
  }, [applyAnnotationAction]);

  return (
    <ToolContext.Provider
      value={{
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
        applyAnnotationAction,
      }}
    >
      {children}
    </ToolContext.Provider>
  );
};