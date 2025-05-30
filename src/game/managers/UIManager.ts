import Phaser from 'phaser';
import { GameState } from '../config';

export class UIManager {
  private scene: Phaser.Scene;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private movesText: Phaser.GameObjects.Text | null = null;
  private gameOverText: Phaser.GameObjects.Text | null = null;
  private restartButton: Phaser.GameObjects.Text | null = null;
  private rotateLeftButton: Phaser.GameObjects.Text | null = null;
  private rotateRightButton: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public createUI(): void {
    this.createScoreText();
    this.createMovesText();
    this.createRotateButtons();
    this.createGameOverUI();
  }

  private createScoreText(): void {
    this.scoreText = this.scene.add.text(10, 10, 'Score: 0', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    });
  }

  private createMovesText(): void {
    this.movesText = this.scene.add.text(10, 40, 'Moves: 20', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    });
  }

  private createRotateButtons(): void {
    this.rotateLeftButton = this.scene.add.text(10, 80, 'Rotate Left', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#4ECDC4',
      padding: { x: 10, y: 5 }
    });
    this.rotateLeftButton.setInteractive();

    this.rotateRightButton = this.scene.add.text(150, 80, 'Rotate Right', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#4ECDC4',
      padding: { x: 10, y: 5 }
    });
    this.rotateRightButton.setInteractive();
  }

  private createGameOverUI(): void {
    this.gameOverText = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2 - 50,
      'Game Over!',
      {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#FF6B6B'
      }
    );
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.setVisible(false);

    this.restartButton = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2 + 50,
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
  }

  public updateScore(score: number): void {
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${score}`);
    }
  }

  public updateMoves(moves: number): void {
    if (this.movesText) {
      this.movesText.setText(`Moves: ${moves}`);
    }
  }

  public showGameOver(): void {
    if (this.gameOverText) {
      this.gameOverText.setVisible(true);
    }
    if (this.restartButton) {
      this.restartButton.setVisible(true);
    }
  }

  public hideGameOver(): void {
    if (this.gameOverText) {
      this.gameOverText.setVisible(false);
    }
    if (this.restartButton) {
      this.restartButton.setVisible(false);
    }
  }

  public setRotateButtonCallbacks(
    onRotateLeft: () => void,
    onRotateRight: () => void,
    onRestart: () => void
  ): void {
    if (this.rotateLeftButton) {
      this.rotateLeftButton.on('pointerdown', onRotateLeft);
    }
    if (this.rotateRightButton) {
      this.rotateRightButton.on('pointerdown', onRotateRight);
    }
    if (this.restartButton) {
      this.restartButton.on('pointerdown', onRestart);
    }
  }
} 