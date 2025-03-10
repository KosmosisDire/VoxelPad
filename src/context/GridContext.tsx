// src/context/GridContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  GridData, 
  Chunk, 
  VoxelData, 
  Position, 
  GridConfig,
  positionToKey
} from '../types/grid';
import { useActionContext, ActionType } from './ActionContext';

// Define a batch operation type
interface VoxelBatchOperation {
  chunkPos: Position;
  voxelPos: Position;
  previousVoxel: VoxelData | null;
  newVoxel: VoxelData | null; // null means removal
}

interface GridContextProps {
  gridData: GridData;
  gridConfig: GridConfig;
  setGridConfig: (config: Partial<GridConfig>) => void;
  placeVoxel: (chunkPos: Position, voxelPos: Position, color: string) => void;
  removeVoxel: (chunkPos: Position, voxelPos: Position) => void;
  clearGrid: () => void;
  resetGrid: () => void;
  applyVoxelAction: (action: any) => void;
  startBatch: () => void;
  endBatch: () => void;
  isInBatch: boolean;
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
  
  // Batch operation tracking
  const [isInBatch, setIsInBatch] = useState(false);
  const batchOperationsRef = useRef<VoxelBatchOperation[]>([]);
  
  // Use useRef to avoid the component update during render error
  const actionContextRef = useRef(useActionContext());
  const { recordAction } = actionContextRef.current;

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

  const startBatch = useCallback(() => {
    console.log("Starting batch operation");
    setIsInBatch(true);
    batchOperationsRef.current = [];
  }, []);

  const endBatch = useCallback(() => {
    console.log("Ending batch with", batchOperationsRef.current.length, "operations");
    
    if (isInBatch && batchOperationsRef.current.length > 0) {
      // Make a deep copy of the batch operations to avoid reference issues
      const operations = batchOperationsRef.current.map(op => ({
        chunkPos: { ...op.chunkPos },
        voxelPos: { ...op.voxelPos },
        previousVoxel: op.previousVoxel ? { ...op.previousVoxel } : null,
        newVoxel: op.newVoxel ? { ...op.newVoxel } : null
      }));
      
      // Record a batch action for undo/redo
      console.log("Recording VOXEL_BATCH action with", operations.length, "operations");
      
      recordAction({
        type: ActionType.VOXEL_BATCH,
        operations
      });
      
      // Clear the batch
      batchOperationsRef.current = [];
    } else {
      console.log("Batch empty or not in batch mode - not recording");
    }
    
    setIsInBatch(false);
  }, [isInBatch, recordAction]);

  const clearGrid = useCallback(() => {
    // Record clear grid action before clearing
    const previousGridData = new Map(gridData);
    
    const clearedGrid = new Map(gridData);
    
    clearedGrid.forEach((chunk, key) => {
      clearedGrid.set(key, {
        ...chunk,
        voxels: new Map(),
      });
    });
    
    setGridData(clearedGrid);
    
    // Record the action after state update
    setTimeout(() => {
      recordAction({
        type: ActionType.VOXEL_CLEAR,
        previousGridData
      });
    }, 0);
  }, [gridData, recordAction]);

  const placeVoxel = useCallback((chunkPos: Position, voxelPos: Position, color: string) => {
    const chunkKey = positionToKey(chunkPos);
    const voxelKey = positionToKey(voxelPos);
    
    setGridData(prev => {
      const newGridData = new Map(prev);
      const chunk = newGridData.get(chunkKey);
      
      if (chunk) {
        // Get previous voxel state for undo
        const previousVoxel = chunk.voxels.get(voxelKey) || null;
        
        // Create new voxel data
        const newVoxelData = {
          position: voxelPos,
          color,
          id: uuidv4(),
        };
        
        // Always add to batch - never record individual actions
        // Only add to batch if the voxel didn't already exist or had a different color
        const existingOpIndex = batchOperationsRef.current.findIndex(
          op => positionToKey(op.chunkPos) === chunkKey && 
                positionToKey(op.voxelPos) === voxelKey
        );
        
        if (existingOpIndex === -1) {
          console.log("Adding voxel place to batch:", voxelKey);
          batchOperationsRef.current.push({
            chunkPos,
            voxelPos,
            previousVoxel,
            newVoxel: newVoxelData
          });
        } else {
          console.log("Voxel already in batch, not adding again");
        }
        
        // Update the grid data
        const newVoxels = new Map(chunk.voxels);
        newVoxels.set(voxelKey, newVoxelData);
        
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
        // Get voxel being removed for undo
        const removedVoxel = chunk.voxels.get(voxelKey);
        
        if (removedVoxel) {
          // Always add to batch - never record individual actions
          const existingOpIndex = batchOperationsRef.current.findIndex(
            op => positionToKey(op.chunkPos) === chunkKey && 
                  positionToKey(op.voxelPos) === voxelKey
          );
          
          if (existingOpIndex === -1) {
            console.log("Adding voxel remove to batch:", voxelKey);
            batchOperationsRef.current.push({
              chunkPos,
              voxelPos,
              previousVoxel: removedVoxel,
              newVoxel: null
            });
          } else {
            console.log("Voxel already in batch, not adding again");
          }
          
          // Update the grid data
          const newVoxels = new Map(chunk.voxels);
          newVoxels.delete(voxelKey);
          
          newGridData.set(chunkKey, {
            ...chunk,
            voxels: newVoxels,
          });
        }
      }
      
      return newGridData;
    });
  }, []);
  
  // Apply voxel actions from undo/redo operations
  const applyVoxelAction = useCallback((action: any) => {
    console.log("Applying voxel action:", action.type);
    
    switch (action.type) {
      case ActionType.VOXEL_PLACE:
        if (action.previousVoxel) {
          // Replace with previous voxel (for undo)
          setGridData(prev => {
            const newGridData = new Map(prev);
            const chunkKey = positionToKey(action.chunkPos);
            const voxelKey = positionToKey(action.voxelPos);
            const chunk = newGridData.get(chunkKey);
            
            if (chunk) {
              const newVoxels = new Map(chunk.voxels);
              newVoxels.set(voxelKey, action.previousVoxel);
              
              newGridData.set(chunkKey, {
                ...chunk,
                voxels: newVoxels,
              });
            }
            
            return newGridData;
          });
        } else {
          // Remove voxel (for undo of first placement)
          const chunkKey = positionToKey(action.chunkPos);
          const voxelKey = positionToKey(action.voxelPos);
          
          setGridData(prev => {
            const newGridData = new Map(prev);
            const chunk = newGridData.get(chunkKey);
            
            if (chunk) {
              const newVoxels = new Map(chunk.voxels);
              newVoxels.delete(voxelKey);
              
              newGridData.set(chunkKey, {
                ...chunk,
                voxels: newVoxels,
              });
            }
            
            return newGridData;
          });
        }
        break;
      
      case ActionType.VOXEL_REMOVE:
        // Restore removed voxel (for undo)
        setGridData(prev => {
          const newGridData = new Map(prev);
          const chunkKey = positionToKey(action.chunkPos);
          const voxelKey = positionToKey(action.voxelPos);
          const chunk = newGridData.get(chunkKey);
          
          if (chunk) {
            const newVoxels = new Map(chunk.voxels);
            newVoxels.set(voxelKey, action.removedVoxel);
            
            newGridData.set(chunkKey, {
              ...chunk,
              voxels: newVoxels,
            });
          }
          
          return newGridData;
        });
        break;
      
      case ActionType.VOXEL_CLEAR:
        // Restore previous grid data (for undo)
        setGridData(action.previousGridData);
        break;
        
      case ActionType.VOXEL_BATCH:
        console.log("Processing batch with", action.operations.length, "operations");
        
        // Apply batch operations in reverse order for undo
        setGridData(prev => {
          const newGridData = new Map(prev);
          
          // Apply operations in reverse order (important for undo)
          for (let i = action.operations.length - 1; i >= 0; i--) {
            const op = action.operations[i];
            const chunkKey = positionToKey(op.chunkPos);
            const voxelKey = positionToKey(op.voxelPos);
            const chunk = newGridData.get(chunkKey);
            
            if (chunk) {
              const newVoxels = new Map(chunk.voxels);
              
              if (op.previousVoxel) {
                // Restore the previous voxel
                console.log("Restoring voxel at", voxelKey);
                newVoxels.set(voxelKey, op.previousVoxel);
              } else if (op.newVoxel) {
                // This was a new voxel with no previous state, so delete it
                console.log("Removing voxel at", voxelKey);
                newVoxels.delete(voxelKey);
              }
              
              newGridData.set(chunkKey, {
                ...chunk,
                voxels: newVoxels,
              });
            }
          }
          
          return newGridData;
        });
        break;
    }
  }, []);

  // Listen for global action events
  useEffect(() => {
    const handleActionEvent = (e: CustomEvent) => {
      const { action, isRedo } = e.detail;
      console.log("GridContext received action event:", action.type, isRedo ? "(redo)" : "(undo)");
      
      // Check if this is a voxel action
      if (
        action.type === ActionType.VOXEL_PLACE ||
        action.type === ActionType.VOXEL_REMOVE ||
        action.type === ActionType.VOXEL_CLEAR ||
        action.type === ActionType.VOXEL_BATCH
      ) {
        // Apply the action based on whether it's an undo or redo
        if (isRedo) {
          // For redo, we need to invert the action
          console.log("Applying voxel redo action:", action.type);
          
          switch(action.type) {
            case ActionType.VOXEL_PLACE:
              // For redo of VOXEL_PLACE, we need to place the voxel again
              applyVoxelAction({
                type: ActionType.VOXEL_REMOVE,
                chunkPos: action.chunkPos,
                voxelPos: action.voxelPos,
                removedVoxel: {
                  position: action.voxelPos,
                  color: action.color,
                  id: 'temp-id'
                }
              });
              break;
              
            case ActionType.VOXEL_REMOVE:
              // For redo of VOXEL_REMOVE, we need to remove the voxel again
              applyVoxelAction({
                type: ActionType.VOXEL_PLACE,
                chunkPos: action.chunkPos,
                voxelPos: action.voxelPos,
                color: action.removedVoxel.color,
                previousVoxel: null
              });
              break;
              
            case ActionType.VOXEL_BATCH:
              // For redo of VOXEL_BATCH, we need to apply the inverted batch
              applyVoxelAction({
                type: ActionType.VOXEL_BATCH,
                operations: action.operations.map((op: any) => ({
                  ...op,
                  // Swap previous and new voxel for redo
                  previousVoxel: op.newVoxel,
                  newVoxel: op.previousVoxel
                }))
              });
              break;
              
            case ActionType.VOXEL_CLEAR:
              // For redo of VOXEL_CLEAR, just clear the grid
              applyVoxelAction({
                type: ActionType.VOXEL_CLEAR,
                previousGridData: new Map()
              });
              break;
          }
        } else {
          // For undo, just apply the action directly
          console.log("Applying voxel undo action:", action.type);
          applyVoxelAction(action);
        }
      }
    };
    
    // Add event listener with proper type casting
    document.addEventListener('action:apply', handleActionEvent as EventListener);
    
    return () => {
      document.removeEventListener('action:apply', handleActionEvent as EventListener);
    };
  }, [applyVoxelAction]);

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
        applyVoxelAction,
        startBatch,
        endBatch,
        isInBatch,
      }}
    >
      {children}
    </GridContext.Provider>
  );
};