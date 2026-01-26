import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CopyButton } from './CopyButton';
import { Download } from 'lucide-react';
import { Button } from './button';

interface QRCodeCardProps {
  value: string;
  size?: number;
  label?: string;
  showCopy?: boolean;
  showDownload?: boolean;
  className?: string;
}

// Simple QR code generator (visual representation)
function generateQRMatrix(data: string, size: number): boolean[][] {
  const hash = Array.from(data).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const matrix: boolean[][] = [];
  
  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      // Create a deterministic pattern based on position and hash
      const val = (hash * (i + 1) * (j + 1) + i * j) % 100;
      matrix[i][j] = val > 40;
    }
  }
  
  // Add finder patterns (corners)
  const addFinderPattern = (startX: number, startY: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6) {
          matrix[startY + i][startX + j] = true;
        } else if (i >= 2 && i <= 4 && j >= 2 && j <= 4) {
          matrix[startY + i][startX + j] = true;
        } else {
          matrix[startY + i][startX + j] = false;
        }
      }
    }
  };
  
  addFinderPattern(0, 0);
  addFinderPattern(size - 7, 0);
  addFinderPattern(0, size - 7);
  
  return matrix;
}

export function QRCodeCard({
  value,
  size = 200,
  label,
  showCopy = true,
  showDownload = true,
  className,
}: QRCodeCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moduleCount = 25;
  const moduleSize = size / moduleCount;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const matrix = generateQRMatrix(value, moduleCount);
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Draw modules
    ctx.fillStyle = '#0f172a';
    matrix.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell) {
          ctx.fillRect(j * moduleSize, i * moduleSize, moduleSize, moduleSize);
        }
      });
    });
  }, [value, size, moduleSize]);
  
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'paylink-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="p-4 bg-white rounded-xl">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-lg"
        />
      </div>
      
      {label && (
        <p className="text-sm text-muted-foreground text-center max-w-[250px] truncate font-mono">
          {label}
        </p>
      )}
      
      {(showCopy || showDownload) && (
        <div className="flex gap-2">
          {showCopy && (
            <CopyButton value={value} variant="outline" size="sm" label="Copy URL" />
          )}
          {showDownload && (
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
