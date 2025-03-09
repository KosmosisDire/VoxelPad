// src/components/tools/PanTool.tsx
import React from 'react';
import { Label } from '@/components/ui/label';

export const PanTool: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-medium">Pan Tool</Label>
        <p className="text-sm text-gray-400 mt-1">
          Click and drag to pan around the grid
        </p>
        <div className="mt-4 bg-gray-800 p-3 rounded-md">
          <h4 className="text-sm font-medium mb-2">Navigation Tips:</h4>
          <ul className="text-sm text-gray-400 space-y-2">
            <li className="flex items-start">
              <span className="bg-gray-700 text-xs px-2 py-1 rounded mr-2 mt-0.5">Middle Mouse</span>
              <span>Pan at any time regardless of selected tool</span>
            </li>
            <li className="flex items-start">
              <span className="bg-gray-700 text-xs px-2 py-1 rounded mr-2 mt-0.5">Mouse Wheel</span>
              <span>Zoom in/out at mouse cursor position</span>
            </li>
            <li className="flex items-start">
              <span className="bg-gray-700 text-xs px-2 py-1 rounded mr-2 mt-0.5">Reset Button</span>
              <span>Reset zoom and pan to default</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};