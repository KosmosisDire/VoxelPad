// src/App.tsx
import React, { useCallback } from 'react';
import { Layout } from './components/layout/Layout';
import { GridProvider } from './context/GridContext';
import { ToolProvider } from './context/ToolContext';
import { ActionProvider, Action, ActionType } from './context/ActionContext';
import { ThemeProvider } from './theme';

const App: React.FC = () => {
  // This function will be passed to the ActionProvider to handle applying undo/redo actions
  const handleApplyAction = useCallback((action: Action & { _isRedo?: boolean }) => {
    console.log("App handleApplyAction:", action.type, action._isRedo ? "(redo)" : "(undo)");
    
    // This will be a global function available to the ActionContext
    // We'll dispatch a custom event that our components can listen for
    const isRedo = !!action._isRedo;
    
    // Create a custom event with the action data
    const actionEvent = new CustomEvent('action:apply', { 
      detail: { action, isRedo } 
    });
    
    // Dispatch the event to be caught by the appropriate handlers
    document.dispatchEvent(actionEvent);
  }, []);

  return (
    <ThemeProvider>
      <ActionProvider onApplyAction={handleApplyAction}>
        <GridProvider>
          <ToolProvider>
            <Layout />
          </ToolProvider>
        </GridProvider>
      </ActionProvider>
    </ThemeProvider>
  );
};

export default App;