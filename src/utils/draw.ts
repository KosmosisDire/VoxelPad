
// src/utils/draw.ts
import { Position } from '../types/grid';

// Interpolate points to get a smooth line
export const interpolatePoints = (point1: Position, point2: Position, steps: number = 10): Position[] => {
    const points: Position[] = [];

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = point1.x + (point2.x - point1.x) * t;
        const y = point1.y + (point2.y - point1.y) * t;

        points.push({ x, y });
    }

    return points;
};

// Get distance between two points
export const getDistance = (point1: Position, point2: Position): number => {
    return Math.sqrt(
        Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
};