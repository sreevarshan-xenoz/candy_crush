import './style.css'
import Phaser from 'phaser';
import { GameScene } from './game/scenes/GameScene';
import { gameConfig } from './game/config';

// Create the game instance
const game = new Phaser.Game({
  ...gameConfig,
  scene: [GameScene],
});

// Export the game instance (useful for debugging)
(window as any).game = game;
