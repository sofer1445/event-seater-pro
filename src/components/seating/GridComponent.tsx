import { Line } from 'react-konva';

interface GridProps {
    width: number;
    height: number;
    cellSize: number;
    color: string;
    opacity: number;
}

export const GridComponent = ({ width, height, cellSize, color, opacity }: GridProps) => {
    const lines = [];
    const numLinesX = Math.ceil(width / cellSize);
    const numLinesY = Math.ceil(height / cellSize);

    // Vertical lines
    for (let i = 0; i <= numLinesX; i++) {
        lines.push(
            <Line
                key={`v${i}`}
                points={[i * cellSize, 0, i * cellSize, height]}
                stroke={color}
                strokeWidth={1}
                opacity={opacity}
            />
        );
    }

    // Horizontal lines
    for (let i = 0; i <= numLinesY; i++) {
        lines.push(
            <Line
                key={`h${i}`}
                points={[0, i * cellSize, width, i * cellSize]}
                stroke={color}
                strokeWidth={1}
                opacity={opacity}
            />
        );
    }

    return <>{lines}</>;
};