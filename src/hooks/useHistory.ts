// src/hooks/useHistory.ts - Much simpler version
import { useActionContext } from '../context/ActionContext';

export const useHistory = () => {
  // Simply pass through the functions directly from ActionContext
  // with no additional wrappers or logic
  const { performUndo, performRedo, canUndo, canRedo } = useActionContext();
  
  return {
    undoAction: performUndo,  // Direct reference, no wrapper function
    redoAction: performRedo,  // Direct reference, no wrapper function
    canUndo,
    canRedo
  };
};