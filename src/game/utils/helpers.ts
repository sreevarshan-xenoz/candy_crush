import { BOARD_COLS, BOARD_ROWS, CANDY_SIZE, CANDY_TYPES, MATCH_MIN, SpecialCandyType } from '../config';

// Type definitions
export interface CandyData {
  type: number;
  specialType: SpecialCandyType;
  row: number;
  col: number;
  x: number;
  y: number;
  isDestroyed: boolean;
  isSwapping: boolean;
  isDropping: boolean;
  isRotating: boolean;
}

export type BoardData = (CandyData | null)[][];

// Helper functions
export function createEmptyBoard(): BoardData {
  const board: BoardData = [];
  for (let row = 0; row < BOARD_ROWS; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_COLS; col++) {
      board[row][col] = null;
    }
  }
  return board;
}

export function generateRandomCandyType(): number {
  return Math.floor(Math.random() * CANDY_TYPES);
}

export function getCandyPosition(row: number, col: number): { x: number, y: number } {
  // Calculate the center position of the candy
  const x = col * CANDY_SIZE + CANDY_SIZE / 2;
  const y = row * CANDY_SIZE + CANDY_SIZE / 2;
  return { x, y };
}

export function createCandyData(row: number, col: number): CandyData {
  const { x, y } = getCandyPosition(row, col);
  return {
    type: generateRandomCandyType(),
    specialType: SpecialCandyType.NONE,
    row,
    col,
    x,
    y,
    isDestroyed: false,
    isSwapping: false,
    isDropping: false,
    isRotating: false,
  };
}

export function fillEmptyBoard(): BoardData {
  const board = createEmptyBoard();
  
  // Fill the board with random candies
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      board[row][col] = createCandyData(row, col);
    }
  }
  
  // Check for initial matches and regenerate if needed
  while (findAllMatches(board).length > 0) {
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        if (board[row][col]) {
          board[row][col]!.type = generateRandomCandyType();
        }
      }
    }
  }
  
  return board;
}

export function findMatches(board: BoardData): CandyData[][] {
  const matches: CandyData[][] = [];
  
  // Check horizontal matches
  for (let row = 0; row < BOARD_ROWS; row++) {
    let matchLength = 1;
    let currentType = -1;
    let matchStart = 0;
    
    for (let col = 0; col < BOARD_COLS; col++) {
      const candy = board[row][col];
      
      if (candy && !candy.isDestroyed) {
        if (candy.type === currentType) {
          matchLength++;
        } else {
          // Check if we had a match before this new type
          if (matchLength >= MATCH_MIN) {
            const match: CandyData[] = [];
            for (let i = matchStart; i < col; i++) {
              if (board[row][i] && !board[row][i]!.isDestroyed) {
                match.push(board[row][i]!);
              }
            }
            matches.push(match);
          }
          
          // Start a new potential match
          currentType = candy.type;
          matchLength = 1;
          matchStart = col;
        }
      } else {
        // Check if we had a match before this empty/destroyed cell
        if (matchLength >= MATCH_MIN) {
          const match: CandyData[] = [];
          for (let i = matchStart; i < col; i++) {
            if (board[row][i] && !board[row][i]!.isDestroyed) {
              match.push(board[row][i]!);
            }
          }
          matches.push(match);
        }
        
        // Reset for next potential match
        currentType = -1;
        matchLength = 0;
      }
    }
    
    // Check for match at the end of the row
    if (matchLength >= MATCH_MIN) {
      const match: CandyData[] = [];
      for (let i = matchStart; i < BOARD_COLS; i++) {
        if (board[row][i] && !board[row][i]!.isDestroyed) {
          match.push(board[row][i]!);
        }
      }
      matches.push(match);
    }
  }
  
  // Check vertical matches
  for (let col = 0; col < BOARD_COLS; col++) {
    let matchLength = 1;
    let currentType = -1;
    let matchStart = 0;
    
    for (let row = 0; row < BOARD_ROWS; row++) {
      const candy = board[row][col];
      
      if (candy && !candy.isDestroyed) {
        if (candy.type === currentType) {
          matchLength++;
        } else {
          // Check if we had a match before this new type
          if (matchLength >= MATCH_MIN) {
            const match: CandyData[] = [];
            for (let i = matchStart; i < row; i++) {
              if (board[i][col] && !board[i][col]!.isDestroyed) {
                match.push(board[i][col]!);
              }
            }
            matches.push(match);
          }
          
          // Start a new potential match
          currentType = candy.type;
          matchLength = 1;
          matchStart = row;
        }
      } else {
        // Check if we had a match before this empty/destroyed cell
        if (matchLength >= MATCH_MIN) {
          const match: CandyData[] = [];
          for (let i = matchStart; i < row; i++) {
            if (board[i][col] && !board[i][col]!.isDestroyed) {
              match.push(board[i][col]!);
            }
          }
          matches.push(match);
        }
        
        // Reset for next potential match
        currentType = -1;
        matchLength = 0;
      }
    }
    
    // Check for match at the end of the column
    if (matchLength >= MATCH_MIN) {
      const match: CandyData[] = [];
      for (let i = matchStart; i < BOARD_ROWS; i++) {
        if (board[i][col] && !board[i][col]!.isDestroyed) {
          match.push(board[i][col]!);
        }
      }
      matches.push(match);
    }
  }
  
  return matches;
}

export function findAllMatches(board: BoardData): CandyData[][] {
  return findMatches(board);
}

export function checkForSpecialCandy(matches: CandyData[][]): void {
  for (const match of matches) {
    if (match.length >= 5) {
      // 5-in-a-row creates a rainbow candy
      match[0].specialType = SpecialCandyType.RAINBOW;
    } else if (match.length === 4) {
      // 4-in-a-row creates a line clear candy
      // Determine if it's horizontal or vertical
      const isHorizontal = match[0].row === match[1].row;
      match[0].specialType = isHorizontal ? SpecialCandyType.LINE_CLEAR_H : SpecialCandyType.LINE_CLEAR_V;
    } else if (match.length === MATCH_MIN) {
      // Check for L or T shape for bomb
      const isLShape = checkLShape(match);
      const isTShape = checkTShape(match);
      
      if (isLShape || isTShape) {
        match[0].specialType = SpecialCandyType.BOMB;
      }
    }
  }
}

function checkLShape(match: CandyData[]): boolean {
  if (match.length !== MATCH_MIN) return false;
  
  // Sort by row and column
  const sortedByRow = [...match].sort((a, b) => a.row - b.row);
  const sortedByCol = [...match].sort((a, b) => a.col - b.col);
  
  // Check for L shape (3 in a row + 1 at the end)
  const isHorizontalL = 
    sortedByRow[0].row === sortedByRow[1].row && 
    sortedByRow[1].row === sortedByRow[2].row &&
    sortedByRow[2].row !== sortedByRow[3].row &&
    sortedByRow[3].col === sortedByRow[2].col;
    
  const isVerticalL = 
    sortedByCol[0].col === sortedByCol[1].col && 
    sortedByCol[1].col === sortedByCol[2].col &&
    sortedByCol[2].col !== sortedByCol[3].col &&
    sortedByCol[3].row === sortedByCol[2].row;
    
  return isHorizontalL || isVerticalL;
}

function checkTShape(match: CandyData[]): boolean {
  if (match.length !== MATCH_MIN) return false;
  
  // Sort by row and column
  const sortedByRow = [...match].sort((a, b) => a.row - b.row);
  const sortedByCol = [...match].sort((a, b) => a.col - b.col);
  
  // Check for T shape (3 in a row + 1 in the middle)
  const isHorizontalT = 
    sortedByRow[0].row === sortedByRow[1].row && 
    sortedByRow[1].row === sortedByRow[2].row &&
    sortedByRow[3].row !== sortedByRow[0].row &&
    sortedByRow[3].col === sortedByRow[1].col;
    
  const isVerticalT = 
    sortedByCol[0].col === sortedByCol[1].col && 
    sortedByCol[1].col === sortedByCol[2].col &&
    sortedByCol[3].col !== sortedByCol[0].col &&
    sortedByCol[3].row === sortedByCol[1].row;
    
  return isHorizontalT || isVerticalT;
}

export function applyGravity(board: BoardData): boolean {
  let hasDropped = false;
  
  // Start from the bottom row and move up
  for (let col = 0; col < BOARD_COLS; col++) {
    for (let row = BOARD_ROWS - 1; row >= 0; row--) {
      // If this cell is empty, find the first non-empty cell above it
      if (board[row][col] === null || board[row][col]!.isDestroyed) {
        for (let aboveRow = row - 1; aboveRow >= 0; aboveRow--) {
          const candy = board[aboveRow][col];
          if (candy && !candy.isDestroyed) {
            // Move the candy down
            board[row][col] = candy;
            board[aboveRow][col] = null;
            
            // Update the candy's position
            candy.row = row;
            const { x, y } = getCandyPosition(row, col);
            candy.x = x;
            candy.y = y;
            candy.isDropping = true;
            
            hasDropped = true;
            break;
          }
        }
      }
    }
  }
  
  return hasDropped;
}

export function refillBoard(board: BoardData): void {
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      if (board[row][col] === null || board[row][col]!.isDestroyed) {
        board[row][col] = createCandyData(row, col);
      }
    }
  }
}

export function swapCandies(board: BoardData, row1: number, col1: number, row2: number, col2: number): void {
  const candy1 = board[row1][col1];
  const candy2 = board[row2][col2];
  
  if (candy1 && candy2) {
    // Swap the candies in the board
    board[row1][col1] = candy2;
    board[row2][col2] = candy1;
    
    // Update the candies' positions
    candy1.row = row2;
    candy1.col = col2;
    const pos1 = getCandyPosition(row2, col2);
    candy1.x = pos1.x;
    candy1.y = pos1.y;
    
    candy2.row = row1;
    candy2.col = col1;
    const pos2 = getCandyPosition(row1, col1);
    candy2.x = pos2.x;
    candy2.y = pos2.y;
    
    // Mark as swapping for animation
    candy1.isSwapping = true;
    candy2.isSwapping = true;
  }
}

export function rotateBoard(board: BoardData, clockwise: boolean = true): void {
  const newBoard: BoardData = createEmptyBoard();
  
  if (clockwise) {
    // Rotate clockwise
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const candy = board[row][col];
        if (candy && !candy.isDestroyed) {
          const newRow = col;
          const newCol = BOARD_ROWS - 1 - row;
          
          newBoard[newRow][newCol] = candy;
          candy.row = newRow;
          candy.col = newCol;
          const { x, y } = getCandyPosition(newRow, newCol);
          candy.x = x;
          candy.y = y;
          candy.isRotating = true;
        }
      }
    }
  } else {
    // Rotate counter-clockwise
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const candy = board[row][col];
        if (candy && !candy.isDestroyed) {
          const newRow = BOARD_COLS - 1 - col;
          const newCol = row;
          
          newBoard[newRow][newCol] = candy;
          candy.row = newRow;
          candy.col = newCol;
          const { x, y } = getCandyPosition(newRow, newCol);
          candy.x = x;
          candy.y = y;
          candy.isRotating = true;
        }
      }
    }
  }
  
  // Copy the new board back to the original
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      board[row][col] = newBoard[row][col];
    }
  }
}

export function calculateScore(matches: CandyData[][]): number {
  let score = 0;
  
  for (const match of matches) {
    // Base score for each match
    const baseScore = match.length * 10;
    
    // Bonus for special candies
    let bonus = 0;
    for (const candy of match) {
      if (candy.specialType !== SpecialCandyType.NONE) {
        bonus += 50;
      }
    }
    
    // Chain bonus (if we implement chain tracking)
    // const chainBonus = chain * 20;
    
    score += baseScore + bonus;
  }
  
  return score;
}

export function hasPossibleMoves(board: BoardData): boolean {
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      // Try swapping with right neighbor
      if (col < BOARD_COLS - 1) {
        if (wouldSwapResultInMatch(board, row, col, row, col + 1)) {
          return true;
        }
      }
      // Try swapping with bottom neighbor
      if (row < BOARD_ROWS - 1) {
        if (wouldSwapResultInMatch(board, row, col, row + 1, col)) {
          return true;
        }
      }
    }
  }
  return false;
}

function wouldSwapResultInMatch(board: BoardData, row1: number, col1: number, row2: number, col2: number): boolean {
  // Make a shallow copy of the board
  const testBoard: BoardData = board.map(row => row.map(cell => cell ? { ...cell } : null));
  swapCandies(testBoard, row1, col1, row2, col2);
  const matches = findAllMatches(testBoard);
  return matches.length > 0;
} 