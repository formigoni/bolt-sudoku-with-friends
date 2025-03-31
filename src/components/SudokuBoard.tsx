import React, { useState, useRef } from 'react';

interface SudokuBoardProps {
  board: number[][];
  onCellChange: (row: number, col: number, value: number) => void;
  isInitial: (row: number, col: number) => boolean;
}

export function SudokuBoard({ board, onCellChange, isInitial }: SudokuBoardProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: 9 }, () => Array(9).fill(null))
  );

  const handleInputChange = (row: number, col: number, value: string) => {
    // Only allow numbers 1-9 or empty string
    if (value === '' || /^[1-9]$/.test(value)) {
      const numValue = value === '' ? 0 : parseInt(value, 10);
      onCellChange(row, col, numValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        e.preventDefault();
        break;
      case 'ArrowDown':
        newRow = Math.min(8, row + 1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        e.preventDefault();
        break;
      case 'ArrowRight':
        newCol = Math.min(8, col + 1);
        e.preventDefault();
        break;
      case 'Backspace':
        handleInputChange(row, col, '');
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        handleInputChange(row, col, e.key);
        break;
    }

    if (newRow !== row || newCol !== col) {
      setSelectedCell({ row: newRow, col: newCol });
      inputRefs.current[newRow][newCol]?.focus(); // Focus the new cell
    }
  };

  return (
    <div className="grid grid-cols-9 gap-[1px] bg-gray-300 p-[1px] rounded-lg">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                size-12 flex items-center justify-center
                ${(rowIndex + 1) % 3 === 0 ? 'border-b-2 border-gray-400' : ''}
                ${(colIndex + 1) % 3 === 0 ? 'border-r-2 border-gray-400' : ''}
                ${(rowIndex === 0) ? 'border-t-2 border-gray-400' : ''}
                ${(colIndex === 0) ? 'border-l-2 border-gray-400' : ''}
                ${isInitial(rowIndex, colIndex) ? 'font-bold bg-gray-50' : 'bg-white'}
                ${isSelected ? 'bg-indigo-50' : ''}
                transition-colors duration-150
              `}
            >
              <input
                ref={(el) => (inputRefs.current[rowIndex][colIndex] = el)} // Assign ref
                type="text"
                value={cell || ''}
                onChange={(e) => !isInitial(rowIndex, colIndex) && handleInputChange(rowIndex, colIndex, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                readOnly={isInitial(rowIndex, colIndex)} // Set readonly for initial cells
                className={`
                  size-full text-center focus:outline-none
                  text-2xl
                  ${isInitial(rowIndex, colIndex) ? 'font-bold bg-gray-50' : ''}
                  ${isSelected ? 'bg-indigo-50' : 'focus:bg-indigo-50'}
                `}
                maxLength={1}
              />
            </div>
          );
        })
      )}
    </div>
  );
}