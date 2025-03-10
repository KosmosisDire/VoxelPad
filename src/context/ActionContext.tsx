// src/context/ActionContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Annotation } from '../types/tools';
import { GridData, VoxelData, Position } from '../types/grid';

export enum ActionType {
  ANNOTATION_ADD = 'ANNOTATION_ADD',
  ANNOTATION_REMOVE = 'ANNOTATION_REMOVE',
  ANNOTATION_CLEAR = 'ANNOTATION_CLEAR',
  VOXEL_PLACE = 'VOXEL_PLACE',
  VOXEL_REMOVE = 'VOXEL_REMOVE',
  VOXEL_CLEAR = 'VOXEL_CLEAR',
  VOXEL_BATCH = 'VOXEL_BATCH',
}

export interface VoxelPlaceAction {
  type: ActionType.VOXEL_PLACE;
  chunkPos: Position;
  voxelPos: Position;
  color: string;
  previousVoxel: VoxelData | null;
}

export interface VoxelRemoveAction {
  type: ActionType.VOXEL_REMOVE;
  chunkPos: Position;
  voxelPos: Position;
  removedVoxel: VoxelData;
}

export interface VoxelClearAction {
  type: ActionType.VOXEL_CLEAR;
  previousGridData: GridData;
}

export interface VoxelBatchOperation {
  chunkPos: Position;
  voxelPos: Position;
  previousVoxel: VoxelData | null;
  newVoxel: VoxelData | null; // null means removal
}

export interface VoxelBatchAction {
  type: ActionType.VOXEL_BATCH;
  operations: VoxelBatchOperation[];
}

export interface AnnotationAddAction {
  type: ActionType.ANNOTATION_ADD;
  annotation: Annotation;
}

export interface AnnotationRemoveAction {
  type: ActionType.ANNOTATION_REMOVE;
  annotation: Annotation;
  index: number;
}

export interface AnnotationClearAction {
  type: ActionType.ANNOTATION_CLEAR;
  previousAnnotations: Annotation[];
}

export type Action = 
  | VoxelPlaceAction 
  | VoxelRemoveAction 
  | VoxelClearAction
  | VoxelBatchAction
  | AnnotationAddAction 
  | AnnotationRemoveAction 
  | AnnotationClearAction;

interface ActionHistory {
  past: Action[];
  future: Action[];
}

interface ActionContextType {
  recordAction: (action: Action) => void;
  getHistoryAction: (direction: 'undo' | 'redo') => Action | undefined;
  performUndo: () => void;
  performRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
  debugHistory: () => void;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export const useActionContext = () => {
  const context = useContext(ActionContext);
  if (!context) {
    throw new Error('useActionContext must be used within an ActionProvider');
  }
  return context;
};

export const ActionProvider: React.FC<{ 
  children: React.ReactNode,
  onApplyAction?: (action: Action & { _isRedo?: boolean }) => void
}> = ({ children, onApplyAction }) => {
  // Initialize history state
  const [history, setHistory] = useState<ActionHistory>({
    past: [],
    future: []
  });

  // Computed properties for undo/redo availability
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // For debugging
  const debugHistory = useCallback(() => {
    console.group("Action History");
    console.log("Past actions:", history.past.map(a => a.type));
    console.log("Future actions:", history.future.map(a => a.type));
    console.log("Can undo:", canUndo);
    console.log("Can redo:", canRedo);
    console.groupEnd();
  }, [history, canUndo, canRedo]);

  // Record a new action
  const recordAction = useCallback((action: Action) => {
    console.log("Recording action:", action.type);
    
    // When a new action occurs, add it to history and clear future
    setHistory(prevHistory => {
      const newHistory = {
        past: [...prevHistory.past, action],
        future: [] // Clear future when a new action is taken
      };
      
      console.log("History updated - past count:", newHistory.past.length);
      return newHistory;
    });
  }, []);

  // Get an action from history without modifying state
  const getHistoryAction = useCallback((direction: 'undo' | 'redo'): Action | undefined => {
    if (direction === 'undo' && !canUndo) {
      console.warn("Cannot undo - no actions in history");
      return undefined;
    }
    
    if (direction === 'redo' && !canRedo) {
      console.warn("Cannot redo - no actions in future");
      return undefined;
    }
    
    if (direction === 'undo') {
      return history.past[history.past.length - 1];
    } else {
      return history.future[0];
    }
  }, [history, canUndo, canRedo]);

  // Apply undo operation
  const performUndo = useCallback(() => {
    if (!canUndo) {
      console.warn("Cannot undo - no actions in history");
      return;
    }
    
    setHistory(prevHistory => {
      const newPast = [...prevHistory.past];
      const lastAction = newPast.pop();
      
      if (lastAction) {
        console.log("Undoing action:", lastAction.type);
        
        // Call external handler to apply the action
        if (onApplyAction) {
          onApplyAction(lastAction);
        }
      }
      
      return {
        past: newPast,
        future: lastAction ? [lastAction, ...prevHistory.future] : prevHistory.future
      };
    });
  }, [canUndo, onApplyAction]);

  // Apply redo operation
  const performRedo = useCallback(() => {
    if (!canRedo) {
      console.warn("Cannot redo - no actions in future");
      return;
    }
    
    setHistory(prevHistory => {
      const newFuture = [...prevHistory.future];
      const nextAction = newFuture.shift();
      
      if (nextAction) {
        console.log("Redoing action:", nextAction.type);
        
        // Call external handler to apply the action
        if (onApplyAction) {
          // For redo, we send the action with a special flag
          onApplyAction({
            ...nextAction,
            _isRedo: true // Add a flag to indicate this is a redo operation
          });
        }
      }
      
      return {
        past: nextAction ? [...prevHistory.past, nextAction] : prevHistory.past,
        future: newFuture
      };
    });
  }, [canRedo, onApplyAction]);

  // Clear all history
  const clearHistory = useCallback(() => {
    console.log("Clearing history");
    setHistory({
      past: [],
      future: []
    });
  }, []);

  // Setup keyboard shortcuts for undo/redo
  useEffect(() => {
    // Add a flag to track whether we're currently processing an undo/redo
    // This prevents recursive or duplicate operations
    let isProcessingAction = false;
  
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle events inside input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Don't proceed if we're already processing an action
      if (isProcessingAction) {
        console.log("Already processing an action, ignoring keyboard event");
        return;
      }
      
      // Undo: Ctrl+Z or Command+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation(); // Stop propagation to prevent duplicate handling
        console.log("ActionContext keyboard shortcut: Undo");
        
        // Set the processing flag
        isProcessingAction = true;
        
        // Use setTimeout to prevent potential recursion
        setTimeout(() => {
          performUndo();
          isProcessingAction = false;
        }, 0);
      }
      
      // Redo: Ctrl+Y or Command+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        e.stopPropagation(); // Stop propagation to prevent duplicate handling
        console.log("ActionContext keyboard shortcut: Redo");
        
        // Set the processing flag
        isProcessingAction = true;
        
        // Use setTimeout to prevent potential recursion
        setTimeout(() => {
          performRedo();
          isProcessingAction = false;
        }, 0);
      }
    };
    
    // Ensure this is the only keyboard shortcut handler for undo/redo
    // by using the capture phase (true as third argument)
    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [performUndo, performRedo]);

  return (
    <ActionContext.Provider
      value={{
        recordAction,
        getHistoryAction,
        performUndo,
        performRedo,
        canUndo,
        canRedo,
        clearHistory,
        debugHistory
      }}
    >
      {children}
    </ActionContext.Provider>
  );
};