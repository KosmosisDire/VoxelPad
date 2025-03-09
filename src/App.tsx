// src/App.tsx

import { Layout } from './components/layout/Layout';
import { GridProvider } from './context/GridContext';
import { ToolProvider } from './context/ToolContext';
import { ThemeProvider } from './theme';

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <GridProvider>
                <ToolProvider>
                    <Layout />
                </ToolProvider>
            </GridProvider>
        </ThemeProvider>
    );
};

export default App;
