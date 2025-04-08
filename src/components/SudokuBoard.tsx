import React, { useState, useRef, useEffect } from 'react';

interface SudokuBoardProps {
  board: number[][];
  onCellChange: (row: number, col: number, value: number) => void;
  isInitial: (row: number, col: number) => boolean;
  playerColor?: string;
}

interface CellCandidates {
  [key: string]: Set<number>; // Using row-col as key
}

export function SudokuBoard({ board, onCellChange, isInitial, playerColor = '#4F46E5' }: SudokuBoardProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [candidates, setCandidates] = useState<CellCandidates>({});
  const [hoveredCandidate, setHoveredCandidate] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[][]>(
    Array.from({ length: 9 }, () => Array(9).fill(null))
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;

      const { row, col } = selectedCell;
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
          if (!isInitial(row, col)) {
            onCellChange(row, col, 0);
          }
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
          if (!isInitial(row, col)) {
            onCellChange(row, col, parseInt(e.key, 10));
          }
          break;
      }

      if (newRow !== row || newCol !== col) {
        setSelectedCell({ row: newRow, col: newCol });
        cellRefs.current[newRow][newCol]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, onCellChange, isInitial]);

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  const getCandidates = (row: number, col: number): Set<number> => {
    return candidates[getCellKey(row, col)] || new Set();
  };

  const toggleCandidate = (row: number, col: number, candidate: number) => {
    if (board[row][col] !== 0 || isInitial(row, col)) return;

    const cellKey = getCellKey(row, col);
    const currentCandidates = new Set(candidates[cellKey] || new Set());

    if (currentCandidates.has(candidate)) {
      currentCandidates.delete(candidate);
    } else {
      currentCandidates.add(candidate);
    }

    setCandidates(prev => ({
      ...prev,
      [cellKey]: currentCandidates
    }));
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    cellRefs.current[row][col]?.focus();
  };

  const getCandidatePosition = (number: number): string => {
    const positions = {
      1: 'top-0 left-0',
      2: 'top-0 left-1/3',
      3: 'top-0 right-0',
      4: 'top-1/3 left-0',
      5: 'top-1/3 left-1/3',
      6: 'top-1/3 right-0',
      7: 'bottom-0 left-0',
      8: 'bottom-0 left-1/3',
      9: 'bottom-0 right-0'
    };
    return positions[number as keyof typeof positions];
  };

  return (
    <div 
      ref={boardRef}
      className="grid grid-cols-9 gap-[1px] bg-gray-300 p-[1px] rounded-lg"
      tabIndex={0}
    >
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
          const cellCandidates = getCandidates(rowIndex, colIndex);
          const showCandidates = isSelected && cell === 0 && !isInitial(rowIndex, colIndex);

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              ref={(el) => (cellRefs.current[rowIndex][colIndex] = el)}
              className={`
                size-8 md:size-12 flex items-center justify-center relative
                ${(rowIndex + 1) % 3 === 0 ? 'border-b-2 border-gray-400' : ''}
                ${(colIndex + 1) % 3 === 0 ? 'border-r-2 border-gray-400' : ''}
                ${(rowIndex === 0) ? 'border-t-2 border-gray-400' : ''}
                ${(colIndex === 0) ? 'border-l-2 border-gray-400' : ''}
                ${isInitial(rowIndex, colIndex) ? 'font-bold bg-gray-50' : 'bg-white'}
                transition-colors duration-150
                cursor-pointer
                focus:outline-none
                focus:ring-2
                focus:ring-inset
              `}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              tabIndex={-1}
              style={{
                backgroundColor: isSelected ? `${playerColor}20` : undefined,
                '--tw-ring-color': isSelected ? playerColor : undefined
              } as React.CSSProperties}
            >
              {cell === 0 && !isInitial(rowIndex, colIndex) ? (
                <div className="relative size-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <div
                      key={num}
                      className={`
                        absolute size-1/3 flex items-center justify-center text-[10px] md:text-xs cursor-pointer
                        ${getCandidatePosition(num)}
                        ${cellCandidates.has(num) ? 'text-gray-600' : (showCandidates && hoveredCandidate === num ? 'text-gray-300' : 'text-transparent')}
                        ${showCandidates && hoveredCandidate === num ? 'bg-gray-100' : ''}
                        ${!showCandidates && !cellCandidates.has(num) ? 'pointer-events-none' : ''}
                      `}
                      onMouseEnter={() => showCandidates && setHoveredCandidate(num)}
                      onMouseLeave={() => showCandidates && setHoveredCandidate(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCandidate(rowIndex, colIndex, num);
                      }}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-lg md:text-2xl">
                  {cell || ''}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}