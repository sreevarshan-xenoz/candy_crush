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
  swapCandies 
} from '../utils/helpers';

export class GameScene extends Phaser.Scene {
  private board: BoardData = [];
  private candies: Candy[][] = [];
  private selectedCandy: Candy | null = null;
  private gameState: GameState = GameState.IDLE;
  private score: number = 0;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private movesLeft: number = 20;
  private movesText: Phaser.GameObjects.Text | null = null;
  private gameOverText: Phaser.GameObjects.Text | null = null;
  private restartButton: Phaser.GameObjects.Text | null = null;
  private rotateLeftButton: Phaser.GameObjects.Text | null = null;
  private rotateRightButton: Phaser.GameObjects.Text | null = null;
  
  constructor() {
    super({ key: 'GameScene' });
  }
  
  preload(): void {
    // Load candy sprites
    this.load.spritesheet('candy', 'assets/candy.png', { 
      frameWidth: 64, 
      frameHeight: 64 
    });
    
    // Load special effect sprites
    this.load.image('special_horizontal', 'assets/special_horizontal.png');
    this.load.image('special_vertical', 'assets/special_vertical.png');
    this.load.image('special_bomb', 'assets/special_bomb.png');
    this.load.image('special_rainbow', 'assets/special_rainbow.png');
    
    // Load particle
    this.load.image('particle', 'assets/particle.png');
    
    // Load UI elements
    this.load.image('button', 'assets/button.png');
    
    // Load sounds
    this.load.audio('swap', 'assets/sounds/swap.mp3');
    this.load.audio('match', 'assets/sounds/match.mp3');
    this.load.audio('special', 'assets/sounds/special.mp3');
    this.load.audio('rotate', 'assets/sounds/rotate.mp3');
    this.load.audio('gameover', 'assets/sounds/gameover.mp3');
  }
  
  create(): void {
    // Initialize the game
    this.initGame();
    
    // Create UI
    this.createUI();
    
    // Set up input handlers
    this.setupInput();
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
    
    // Hide game over UI
    if (this.gameOverText) {
      this.gameOverText.setVisible(false);
    }
    if (this.restartButton) {
      this.restartButton.setVisible(false);
    }
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
  
  private createUI(): void {
    // Create score text
    this.scoreText = this.add.text(10, 10, `Score: ${this.score}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    });
    
    // Create moves text
    this.movesText = this.add.text(10, 40, `Moves: ${this.movesLeft}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    });
    
    // Create rotate buttons
    this.rotateLeftButton = this.add.text(10, 80, 'Rotate Left', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#4ECDC4',
      padding: { x: 10, y: 5 }
    });
    this.rotateLeftButton.setInteractive();
    
    this.rotateRightButton = this.add.text(150, 80, 'Rotate Right', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#4ECDC4',
      padding: { x: 10, y: 5 }
    });
    this.rotateRightButton.setInteractive();
    
    // Create game over text (hidden initially)
    this.gameOverText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      'Game Over!',
      {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#FF6B6B'
      }
    );
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.setVisible(false);
    
    // Create restart button (hidden initially)
    this.restartButton = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 50,
      'Restart',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#4ECDC4',
        padding: { x: 20, y: 10 }
      }
    );
    this.restartButton.setOrigin(0.5);
    this.restartButton.setInteractive();
    this.restartButton.setVisible(false);
    
    // Add restart button event
    this.restartButton.on('pointerdown', () => {
      this.initGame();
    });
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
    
    // Add rotate button events
    if (this.rotateLeftButton) {
      this.rotateLeftButton.on('pointerdown', () => {
        this.onRotateButtonClick(false);
      });
    }
    
    if (this.rotateRightButton) {
      this.rotateRightButton.on('pointerdown', () => {
        this.onRotateButtonClick(true);
      });
    }
  }
  
  private onCandyClick(row: number, col: number): void {
    // Ignore clicks if game is not in idle state
    if (this.gameState !== GameState.IDLE) {
      return;
    }
    
    const candy = this.candies[row][col];
    if (!candy) return;
    
    // If no candy is selected, select this one
    if (!this.selectedCandy) {
      this.selectedCandy = candy;
      candy.setTint(0xffff00);
      return;
    }
    
    // If the same candy is clicked, deselect it
    if (this.selectedCandy === candy) {
      this.selectedCandy.clearTint();
      this.selectedCandy = null;
      return;
    }
    
    // Get the selected candy's position
    const selectedRow = this.selectedCandy.getCandyData().row;
    const selectedCol = this.selectedCandy.getCandyData().col;
    
    // Check if the candies are adjacent
    const isAdjacent = 
      (Math.abs(row - selectedRow) === 1 && col === selectedCol) ||
      (Math.abs(col - selectedCol) === 1 && row === selectedRow);
    
    if (isAdjacent) {
      // Swap the candies
      this.swapCandies(selectedRow, selectedCol, row, col);
    } else {
      // Deselect the current candy and select the new one
      this.selectedCandy.clearTint();
      this.selectedCandy = candy;
      candy.setTint(0xffff00);
    }
  }
  
  private onRotateButtonClick(clockwise: boolean): void {
    // Ignore if game is not in idle state
    if (this.gameState !== GameState.IDLE) {
      return;
    }
    
    // Decrease moves
    this.movesLeft--;
    if (this.movesText) {
      this.movesText.setText(`Moves: ${this.movesLeft}`);
    }
    
    // Play sound
    this.sound.play('rotate');
    
    // Rotate the board
    this.gameState = GameState.ROTATING;
    rotateBoard(this.board, clockwise);
    
    // Update candy sprites
    this.updateCandySprites();
    
    // Check for matches after rotation
    this.checkForMatches();
  }
  
  private swapCandies(row1: number, col1: number, row2: number, col2: number): void {
    // Decrease moves
    this.movesLeft--;
    if (this.movesText) {
      this.movesText.setText(`Moves: ${this.movesLeft}`);
    }
    
    // Play sound
    this.sound.play('swap');
    
    // Clear selection
    if (this.selectedCandy) {
      this.selectedCandy.clearTint();
      this.selectedCandy = null;
    }
    
    // Swap in the data model
    swapCandies(this.board, row1, col1, row2, col2);
    
    // Update candy sprites
    this.updateCandySprites();
    
    // Change game state
    this.gameState = GameState.SWAPPING;
    
    // Wait for swap animation to complete
    this.time.delayedCall(300, () => {
      // Check for matches
      this.checkForMatches();
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
      this.sound.play('match');
      
      // Check for special candies
      checkForSpecialCandy(matches);
      
      // Calculate score
      const matchScore = calculateScore(matches);
      this.score += matchScore;
      if (this.scoreText) {
        this.scoreText.setText(`Score: ${this.score}`);
      }
      
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
    // Apply gravity to the board
    const hasDropped = applyGravity(this.board);
    
    if (hasDropped) {
      // Update candy sprites
      this.updateCandySprites();
      
      // Change game state
      this.gameState = GameState.DROPPING;
      
      // Wait for drop animation to complete
      this.time.delayedCall(300, () => {
        // Refill the board
        this.refillBoard();
      });
    } else {
      // No drops, check for matches again
      this.checkForMatches();
    }
  }
  
  private refillBoard(): void {
    // Refill empty cells
    refillBoard(this.board);
    
    // Update candy sprites
    this.updateCandySprites();
    
    // Change game state
    this.gameState = GameState.REFILLING;
    
    // Wait for refill animation to complete
    this.time.delayedCall(300, () => {
      // Check for matches again
      this.checkForMatches();
    });
  }
  
  private checkGameOver(): void {
    // Check if we're out of moves
    if (this.movesLeft <= 0) {
      this.gameOver();
    }
  }
  
  private gameOver(): void {
    // Play game over sound
    this.sound.play('gameover');
    
    // Change game state
    this.gameState = GameState.GAME_OVER;
    
    // Show game over UI
    if (this.gameOverText) {
      this.gameOverText.setVisible(true);
    }
    if (this.restartButton) {
      this.restartButton.setVisible(true);
    }
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
} 