// src/types/tools.ts
export enum ToolType {
    VOXEL_PLACE = 'VOXEL_PLACE',
    ERASER = 'ERASER',
    LINE = 'LINE',
    RECTANGLE = 'RECTANGLE',
    FREE_DRAW = 'FREE_DRAW',
    PAN = 'PAN',
}

export interface Position {
    x: number;
    y: number;
}

export interface Annotation {
    id: string;
    type: ToolType;
    points: Position[];
    color: string;
    thickness: number;
}

export interface ToolState {
    activeTool: ToolType;
    activeColor: string;
    brushSize: number;
    annotations: Annotation[];
}