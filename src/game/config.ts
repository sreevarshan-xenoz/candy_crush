import type { Types } from 'phaser';

// Game constants
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const BOARD_ROWS = 8;
export const BOARD_COLS = 8;
export const CANDY_SIZE = 64;
export const CANDY_TYPES = 6; // Number of different candy types
export const MATCH_MIN = 3; // Minimum number of candies to form a match

// Candy colors
export const CANDY_COLORS = [
  0xFF6B6B, // Red
  0x4ECDC4, // Teal
  0xFFE66D, // Yellow
  0x6B66FF, // Purple
  0x66FF6B, // Green
  0xFF9966, // Orange
];

// Special candy types
export enum SpecialCandyType {
  NONE = 0,
  LINE_CLEAR_H = 1, // Horizontal line clear
  LINE_CLEAR_V = 2, // Vertical line clear
  BOMB = 3,         // 3x3 area clear
  RAINBOW = 4,      // Clear all of one type
}

// Game states
export enum GameState {
  IDLE = 'idle',
  SWAPPING = 'swapping',
  CHECKING = 'checking',
  DESTROYING = 'destroying',
  DROPPING = 'dropping',
  REFILLING = 'refilling',
  ROTATING = 'rotating',
  GAME_OVER = 'game_over',
  LEVEL_COMPLETE = 'level_complete',
}

// Phaser game config
export const gameConfig: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-canvas-container',
  backgroundColor: '#2C3E50',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [], // Scenes will be added here
  pixelArt: false,
  roundPixels: true,
  antialias: true,
}; 