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

export class BoardManager {
  private scene: Phaser.Scene;
  private board: BoardData = [];
  private candies: (Candy | null)[][] = [];
  private selectedCandy: Candy | null = null;
  private gameState: GameState = GameState.IDLE;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public initialize(): void {
    this.board = fillEmptyBoard();
    this.createCandies();
    this.gameState = GameState.IDLE;
  }

  private createCandies(): void {
    this.candies = [];
    for (let row = 0; row < BOARD_ROWS; row++) {
      this.candies[row] = [];
      for (let col = 0; col < BOARD_COLS; col++) {
        const candyData = this.board[row][col];
        if (candyData) {
          const candy = new Candy(this.scene, candyData);
          this.candies[row][col] = candy;
        } else {
          this.candies[row][col] = null;
        }
      }
    }
  }

  public setupInput(onCandyClick: (row: number, col: number) => void): void {
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const candy = this.candies[row][col];
        if (candy) {
          candy.on('pointerdown', () => onCandyClick(row, col));
        }
      }
    }
  }

  public handleCandyClick(row: number, col: number): void {
    if (this.gameState !== GameState.IDLE) return;

    const clickedCandy = this.candies[row][col];
    if (!clickedCandy) return;

    if (!this.selectedCandy) {
      this.selectedCandy = clickedCandy;
      clickedCandy.setSelected(true);
    } else {
      const selectedRow = this.selectedCandy.getRow();
      const selectedCol = this.selectedCandy.getCol();

      if (this.areAdjacent(selectedRow, selectedCol, row, col)) {
        this.swapCandies(selectedRow, selectedCol, row, col);
      }

      this.selectedCandy.setSelected(false);
      this.selectedCandy = null;
    }
  }

  private areAdjacent(row1: number, col1: number, row2: number, col2: number): boolean {
    return (
      (Math.abs(row1 - row2) === 1 && col1 === col2) ||
      (Math.abs(col1 - col2) === 1 && row1 === row2)
    );
  }

  public swapCandies(row1: number, col1: number, row2: number, col2: number): void {
    this.gameState = GameState.SWAPPING;

    const candy1 = this.candies[row1][col1];
    const candy2 = this.candies[row2][col2];

    if (!candy1 || !candy2) return;

    // Swap in the data structure
    [this.board[row1][col1], this.board[row2][col2]] = 
    [this.board[row2][col2], this.board[row1][col1]];

    // Update candy positions
    candy1.moveTo(row2, col2);
    candy2.moveTo(row1, col1);

    // Update candies array
    [this.candies[row1][col1], this.candies[row2][col2]] = 
    [this.candies[row2][col2], this.candies[row1][col1]];

    // Play swap sound
    this.scene.sound.play('swap');
  }

  public rotateBoard(clockwise: boolean): void {
    if (this.gameState !== GameState.IDLE) return;

    this.gameState = GameState.ROTATING;
    this.board = rotateBoard(this.board, clockwise);
    this.updateCandySprites();
    this.scene.sound.play('rotate');
  }

  private updateCandySprites(): void {
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const candy = this.candies[row][col];
        if (candy) {
          candy.moveTo(row, col);
        }
      }
    }
  }

  public checkForMatches(): { matches: number[][], score: number } {
    const matches = findAllMatches(this.board);
    const score = calculateScore(matches);
    return { matches, score };
  }

  public applyGravity(): void {
    this.gameState = GameState.DROPPING;
    this.board = applyGravity(this.board);
    this.updateCandySprites();
  }

  public refillBoard(): void {
    this.gameState = GameState.REFILLING;
    this.board = refillBoard(this.board);
    this.updateCandySprites();
  }

  public areAllCandiesIdle(): boolean {
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const candy = this.candies[row][col];
        if (candy && !candy.isIdle()) {
          return false;
        }
      }
    }
    return true;
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public setGameState(state: GameState): void {
    this.gameState = state;
  }

  public getBoard(): BoardData {
    return this.board;
  }

  public getCandies(): (Candy | null)[][] {
    return this.candies;
  }
} 