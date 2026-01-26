import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface IdenticonProps {
  value: string;
  size?: number;
  className?: string;
}

// Simple hash function for deterministic colors
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Generate HSL color from hash
function hashToColor(hash: number, index: number): string {
  const hue = (hash + index * 137) % 360;
  const saturation = 60 + (hash % 20);
  const lightness = 45 + (hash % 15);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function Identicon({ value, size = 40, className }: IdenticonProps) {
  const pattern = useMemo(() => {
    const hash = hashCode(value || 'default');
    const gridSize = 5;
    const cells: boolean[] = [];
    
    // Generate symmetric pattern
    for (let i = 0; i < gridSize * Math.ceil(gridSize / 2); i++) {
      cells.push((hash >> (i % 32)) & 1 ? true : false);
    }
    
    // Mirror for symmetry
    const fullCells: boolean[] = [];
    for (let row = 0; row < gridSize; row++) {
      const rowCells: boolean[] = [];
      for (let col = 0; col < Math.ceil(gridSize / 2); col++) {
        rowCells.push(cells[row * Math.ceil(gridSize / 2) + col]);
      }
      // Mirror
      const mirrored = [...rowCells, ...rowCells.slice(0, Math.floor(gridSize / 2)).reverse()];
      fullCells.push(...mirrored);
    }
    
    return {
      cells: fullCells,
      color1: hashToColor(hash, 0),
      color2: hashToColor(hash, 3),
    };
  }, [value]);

  const cellSize = size / 5;

  return (
    <div
      className={cn('rounded-lg overflow-hidden flex-shrink-0', className)}
      style={{ width: size, height: size, background: pattern.color2 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {pattern.cells.map((filled, i) => {
          if (!filled) return null;
          const x = (i % 5) * cellSize;
          const y = Math.floor(i / 5) * cellSize;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              fill={pattern.color1}
            />
          );
        })}
      </svg>
    </div>
  );
}
