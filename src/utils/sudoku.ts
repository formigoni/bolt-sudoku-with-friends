// Utility function to check if a number is valid in a given position
function isValid(board: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
}

// Function to solve the Sudoku puzzle
function solveSudoku(board: number[][]): boolean {
  let row = -1;
  let col = -1;
  let isEmpty = false;

  // Find an empty cell
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) {
        row = i;
        col = j;
        isEmpty = true;
        break;
      }
    }
    if (isEmpty) break;
  }

  // No empty cell found, puzzle solved
  if (!isEmpty) return true;

  // Try digits 1-9
  for (let num = 1; num <= 9; num++) {
    if (isValid(board, row, col, num)) {
      board[row][col] = num;
      if (solveSudoku(board)) return true;
      board[row][col] = 0;
    }
  }

  return false;
}

// Function to generate a new Sudoku puzzle
export function generateSudoku(): { puzzle: number[][], solution: number[][] } {
  // Create empty board
  const board: number[][] = Array(9).fill(0).map(() => Array(9).fill(0));
  
  // Fill diagonal 3x3 boxes with random numbers
  for (let i = 0; i < 9; i += 3) {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let row = i; row < i + 3; row++) {
      for (let col = i; col < i + 3; col++) {
        const randomIndex = Math.floor(Math.random() * nums.length);
        board[row][col] = nums[randomIndex];
        nums.splice(randomIndex, 1);
      }
    }
  }

  // Solve the board to create a complete solution
  solveSudoku(board);

  // Create a copy of the solution
  const solution = board.map(row => [...row]);
  
  // Remove numbers to create the puzzle
  const puzzle = board.map(row => [...row]);
  const cellsToRemove = 45; // Adjust difficulty by changing this number
  let removed = 0;
  
  while (removed < cellsToRemove) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      removed++;
    }
  }

  return { puzzle, solution };
}

// Function to check if a move is valid
export function isValidMove(board: number[][], row: number, col: number, value: number): boolean {
  return isValid(board, row, col, value);
}

// Function to check if the puzzle is complete
export function isComplete(board: number[][]): boolean {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) return false;
    }
  }
  return true;
}