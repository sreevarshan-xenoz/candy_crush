import Phaser from 'phaser';
import { BOARD_COLS, BOARD_ROWS, CANDY_SIZE, GameState } from '../config';
import { Candy } from '../objects/Candy';
import type { BoardData, CandyData } from '../utils/helpers';
import { 
  applyGravity, 
  calculateScore, 
  checkForSpecialCandy, 
  createEmptyBoard, 
  findAllMatches, 
  fillEmptyBoard, 
  refillBoard, 
  rotateBoard, 
  swapCandies, 
  hasPossibleMoves 
} from '../utils/helpers';

export class GameScene extends Phaser.Scene {
  private board: BoardData = [];
  private candies: (Candy | null)[][] = [];
  private selectedCandy: Candy | null = null;
  private gameState: GameState = GameState.IDLE;
  private score: number = 0;
  private movesLeft: number = 20;
  
  constructor() {
    super({ key: 'GameScene' });
  }
  
  preload(): void {
    // Commented out all asset loading to avoid missing asset errors
    // this.load.image('special_horizontal', 'assets/special_horizontal.png');
    // this.load.image('special_vertical', 'assets/special_vertical.png');
    // this.load.image('special_bomb', 'assets/special_bomb.png');
    // this.load.image('special_rainbow', 'assets/special_rainbow.png');
    // this.load.image('particle', 'assets/particle.png');
    // this.load.image('button', 'assets/button.png');
    // this.load.audio('swap', 'assets/sounds/swap.mp3');
    // this.load.audio('match', 'assets/sounds/match.mp3');
    // this.load.audio('special', 'assets/sounds/special.mp3');
    // this.load.audio('rotate', 'assets/sounds/rotate.mp3');
    // this.load.audio('gameover', 'assets/sounds/gameover.mp3');
  }
  
  create(): void {
    // Initialize the game
    this.initGame();
    
    // Set up input handlers
    this.setupInput();
    
    // Wire up HTML rotate buttons
    const rotateLeftBtn = document.getElementById('rotate-left');
    if (rotateLeftBtn) {
      rotateLeftBtn.addEventListener('click', () => this.onRotateButtonClick(false));
    }
    const rotateRightBtn = document.getElementById('rotate-right');
    if (rotateRightBtn) {
      rotateRightBtn.addEventListener('click', () => this.onRotateButtonClick(true));
    }
    
    // Wire up restart button
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        const overlay = document.getElementById('game-over-overlay');
        if (overlay) overlay.style.display = 'none';
        this.initGame();
      });
    }
    
    // Update HTML UI
    this.updateHtmlUI();
  }
  
  update(): void {
    // Update game state
    this.updateGameState();
  }
  
  private initGame(): void {
    // Initialize the board
    this.board = fillEmptyBoard();
    
    // Create candy sprites
    this.createCandies();
    
    // Reset game state
    this.gameState = GameState.IDLE;
    this.score = 0;
    this.movesLeft = 20;
    
    // Update HTML UI
    this.updateHtmlUI();
  }
  
  private createCandies(): void {
    // Clear existing candies
    this.candies = [];
    
    // Create candy sprites for each cell
    for (let row = 0; row < BOARD_ROWS; row++) {
      this.candies[row] = [];
      for (let col = 0; col < BOARD_COLS; col++) {
        const candyData = this.board[row][col];
        if (candyData) {
          const candy = new Candy(this, candyData);
          this.candies[row][col] = candy;
        } else {
          this.candies[row][col] = null;
        }
      }
    }
  }
  
  private setupInput(): void {
    // Add click event to each candy
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const candy = this.candies[row][col];
        if (candy) {
          candy.on('pointerdown', () => {
            this.onCandyClick(row, col);
          });
        }
      }
    }
  }
  
  private onCandyClick(row: number, col: number): void {
    if (this.gameState !== GameState.IDLE) return;
    const candy = this.candies[row][col];
    if (!candy) return;
    if (!this.selectedCandy) {
      this.selectedCandy = candy;
      candy.setSelected(true);
      return;
    }
    if (this.selectedCandy === candy) {
      this.selectedCandy.setSelected(false);
      this.selectedCandy = null;
      return;
    }
    const selectedRow = this.selectedCandy.getCandyData().row;
    const selectedCol = this.selectedCandy.getCandyData().col;
    const isAdjacent =
      (Math.abs(row - selectedRow) === 1 && col === selectedCol) ||
      (Math.abs(col - selectedCol) === 1 && row === selectedRow);
    if (isAdjacent) {
      // Only allow swap if it results in a match
      if (this.wouldSwapResultInMatch(selectedRow, selectedCol, row, col)) {
        this.swapCandies(selectedRow, selectedCol, row, col);
      } else {
        // Invalid swap: shake both candies
        this.shakeCandy(this.selectedCandy);
        this.shakeCandy(candy);
        this.selectedCandy.setSelected(false);
        this.selectedCandy = null;
      }
    } else {
      this.selectedCandy.setSelected(false);
      this.selectedCandy = candy;
      candy.setSelected(true);
    }
  }
  
  private wouldSwapResultInMatch(row1: number, col1: number, row2: number, col2: number): boolean {
    // Use the helper's logic
    const board = this.board;
    // Make a shallow copy of the board
    const testBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
    swapCandies(testBoard, row1, col1, row2, col2);
    const matches = findAllMatches(testBoard);
    return matches.length > 0;
  }
  
  private shakeCandy(candy: Candy) {
    this.tweens.add({
      targets: candy,
      x: candy.x - 10,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        candy.x = candy.candyData.x;
      }
    });
  }
  
  private onRotateButtonClick(clockwise: boolean): void {
    if (this.gameState !== GameState.IDLE) return;
    this.movesLeft--;
    this.updateHtmlUI();
    this.gameState = GameState.ROTATING;
    rotateBoard(this.board, clockwise);
    this.updateCandySprites();
    this.checkForMatches();
    this.checkPossibleMovesOrGameOver();
  }
  
  private swapCandies(row1: number, col1: number, row2: number, col2: number): void {
    this.movesLeft--;
    this.updateHtmlUI();
    if (this.selectedCandy) {
      this.selectedCandy.setSelected(false);
      this.selectedCandy = null;
    }
    swapCandies(this.board, row1, col1, row2, col2);
    this.updateCandySprites();
    this.gameState = GameState.SWAPPING;
    this.time.delayedCall(300, () => {
      this.checkForMatches();
      this.checkPossibleMovesOrGameOver();
    });
  }
  
  private updateCandySprites(): void {
    // Update all candy sprites to match the board data
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const candyData = this.board[row][col];
        const candy = this.candies[row][col];
        
        if (candyData && candy) {
          // Update existing candy
          candy.update(candyData);
          candy.moveToCell(candyData.row, candyData.col);
        } else if (candyData && !candy) {
          // Create new candy
          this.candies[row][col] = new Candy(this, candyData);
        } else if (!candyData && candy) {
          // Remove candy
          candy.destroy();
          this.candies[row][col] = null;
        }
      }
    }
  }
  
  private checkForMatches(): void {
    // Find all matches
    const matches = findAllMatches(this.board);
    
    if (matches.length > 0) {
      // Play match sound
      // this.sound.play('match');
      
      // Check for special candies
      checkForSpecialCandy(matches);
      
      // Calculate score
      const matchScore = calculateScore(matches);
      this.score += matchScore;
      this.updateHtmlUI();
      
      // Mark matched candies as destroyed
      for (const match of matches) {
        for (const candy of match) {
          candy.isDestroyed = true;
        }
      }
      
      // Update candy sprites
      this.updateCandySprites();
      
      // Change game state
      this.gameState = GameState.DESTROYING;
      
      // Wait for destroy animation to complete
      this.time.delayedCall(500, () => {
        // Apply gravity
        this.applyGravity();
      });
    } else {
      // No matches, revert the swap if we were swapping
      if (this.gameState === GameState.SWAPPING) {
        // Revert the swap
        const lastSwap = this.getLastSwap();
        if (lastSwap) {
          swapCandies(this.board, lastSwap.row1, lastSwap.col1, lastSwap.row2, lastSwap.col2);
          this.updateCandySprites();
        }
      }
      
      // Check if game is over
      this.checkGameOver();
      
      // Return to idle state
      this.gameState = GameState.IDLE;
    }
  }
  
  private getLastSwap(): { row1: number, col1: number, row2: number, col2: number } | null {
    // This is a simplified version - in a real game, you'd track the last swap
    // For now, we'll just return null
    return null;
  }
  
  private applyGravity(): void {
    const hasDropped = applyGravity(this.board);
    if (hasDropped) {
      this.updateCandySprites();
      this.gameState = GameState.DROPPING;
      this.time.delayedCall(300, () => {
        this.refillBoard();
        this.checkPossibleMovesOrGameOver();
      });
    } else {
      this.checkForMatches();
      this.checkPossibleMovesOrGameOver();
    }
  }
  
  private refillBoard(): void {
    refillBoard(this.board);
    this.updateCandySprites();
    this.gameState = GameState.REFILLING;
    this.time.delayedCall(300, () => {
      this.checkForMatches();
      this.checkPossibleMovesOrGameOver();
    });
  }
  
  private checkGameOver(): void {
    // Check if we're out of moves
    if (this.movesLeft <= 0) {
      this.gameOver();
    }
  }
  
  private gameOver(): void {
    this.gameState = GameState.GAME_OVER;
    // Show game over overlay
    const overlay = document.getElementById('game-over-overlay');
    if (overlay) overlay.style.display = 'flex';
  }
  
  private updateGameState(): void {
    // Update game state based on current state
    switch (this.gameState) {
      case GameState.IDLE:
        // Nothing to do in idle state
        break;
      case GameState.SWAPPING:
        // Check if all candies have finished swapping
        if (this.areAllCandiesIdle()) {
          this.gameState = GameState.CHECKING;
          this.checkForMatches();
        }
        break;
      case GameState.DROPPING:
        // Check if all candies have finished dropping
        if (this.areAllCandiesIdle()) {
          this.gameState = GameState.REFILLING;
          this.refillBoard();
        }
        break;
      case GameState.ROTATING:
        // Check if all candies have finished rotating
        if (this.areAllCandiesIdle()) {
          this.gameState = GameState.CHECKING;
          this.checkForMatches();
        }
        break;
      // Other states are handled by timeouts
    }
  }
  
  private areAllCandiesIdle(): boolean {
    // Check if all candies are in idle state (not swapping, dropping, or rotating)
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const candy = this.candies[row][col];
        if (candy) {
          const candyData = candy.getCandyData();
          if (candyData.isSwapping || candyData.isDropping || candyData.isRotating) {
            return false;
          }
        }
      }
    }
    return true;
  }
  
  private updateHtmlUI(): void {
    const scoreLabel = document.getElementById('score-label');
    if (scoreLabel) scoreLabel.textContent = `Score: ${this.score}`;
    const movesLabel = document.getElementById('moves-label');
    if (movesLabel) movesLabel.textContent = `Moves: ${this.movesLeft}`;
  }
  
  private checkPossibleMovesOrGameOver(): void {
    if (!hasPossibleMoves(this.board) || this.movesLeft <= 0) {
      this.gameOver();
    }
  }
} 