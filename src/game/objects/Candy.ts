import Phaser from 'phaser';
import { CANDY_COLORS, CANDY_SIZE, SpecialCandyType } from '../config';
import type { CandyData } from '../utils/helpers';

export class Candy extends Phaser.GameObjects.Sprite {
  private candyData: CandyData;
  private specialEffect: Phaser.GameObjects.Sprite | null = null;
  private specialParticles: Phaser.GameObjects.Particles.ParticleEmitterManager | null = null;
  
  constructor(scene: Phaser.Scene, candyData: CandyData) {
    super(scene, candyData.x, candyData.y, 'candy');
    
    this.candyData = candyData;
    
    // Set the frame based on the candy type
    this.setFrame(`candy_${candyData.type}`);
    this.setScale(CANDY_SIZE / this.width);
    this.setInteractive();
    
    // Add to the scene
    scene.add.existing(this);
    
    // Create special effect if needed
    this.updateSpecialEffect();
    
    // Add hover effect
    this.on('pointerover', () => {
      if (!this.candyData.isSwapping && !this.candyData.isDropping && !this.candyData.isRotating) {
        this.setScale((CANDY_SIZE / this.width) * 1.1);
      }
    });
    
    this.on('pointerout', () => {
      if (!this.candyData.isSwapping && !this.candyData.isDropping && !this.candyData.isRotating) {
        this.setScale(CANDY_SIZE / this.width);
      }
    });
  }
  
  public update(candyData: CandyData): void {
    this.candyData = candyData;
    
    // Update position
    this.x = candyData.x;
    this.y = candyData.y;
    
    // Update frame if type changed
    this.setFrame(`candy_${candyData.type}`);
    
    // Update special effect if needed
    if (this.candyData.specialType !== SpecialCandyType.NONE) {
      this.updateSpecialEffect();
    }
    
    // Reset animation flags
    if (candyData.isSwapping) {
      this.playSwapAnimation();
    } else if (candyData.isDropping) {
      this.playDropAnimation();
    } else if (candyData.isRotating) {
      this.playRotateAnimation();
    } else if (candyData.isDestroyed) {
      this.playDestroyAnimation();
    }
  }
  
  private updateSpecialEffect(): void {
    // Remove existing special effect if any
    if (this.specialEffect) {
      this.specialEffect.destroy();
      this.specialEffect = null;
    }
    
    if (this.specialParticles) {
      this.specialParticles.destroy();
      this.specialParticles = null;
    }
    
    // Create new special effect based on type
    if (this.candyData.specialType !== SpecialCandyType.NONE) {
      let effectKey = '';
      
      switch (this.candyData.specialType) {
        case SpecialCandyType.LINE_CLEAR_H:
          effectKey = 'special_horizontal';
          break;
        case SpecialCandyType.LINE_CLEAR_V:
          effectKey = 'special_vertical';
          break;
        case SpecialCandyType.BOMB:
          effectKey = 'special_bomb';
          break;
        case SpecialCandyType.RAINBOW:
          effectKey = 'special_rainbow';
          break;
      }
      
      if (effectKey) {
        this.specialEffect = this.scene.add.sprite(this.x, this.y, effectKey);
        this.specialEffect.setScale(CANDY_SIZE / this.specialEffect.width);
        this.specialEffect.setDepth(this.depth - 1);
        
        // Add particles for special candies
        if (this.candyData.specialType === SpecialCandyType.RAINBOW) {
          this.addRainbowParticles();
        }
      }
    }
  }
  
  private addRainbowParticles(): void {
    // Create a particle manager
    this.specialParticles = this.scene.add.particles(0, 0, 'particle');
    
    // Create an emitter
    this.specialParticles.createEmitter({
      x: this.x,
      y: this.y,
      frequency: 100,
      quantity: 1,
      tint: CANDY_COLORS[this.candyData.type],
      alpha: { start: 0.8, end: 0 },
      scale: { start: 0.2, end: 0 },
      speed: { min: 20, max: 50 },
      lifespan: 1000,
      blendMode: 'ADD',
      emitting: true
    });
  }
  
  public playSwapAnimation(): void {
    // Scale up and down for swap animation
    this.scene.tweens.add({
      targets: this,
      scaleX: (CANDY_SIZE / this.width) * 1.2,
      scaleY: (CANDY_SIZE / this.width) * 1.2,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        this.setScale(CANDY_SIZE / this.width);
        this.candyData.isSwapping = false;
      }
    });
  }
  
  public playDropAnimation(): void {
    // Bounce effect for dropping
    this.scene.tweens.add({
      targets: this,
      y: this.y + 10,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.candyData.isDropping = false;
      }
    });
  }
  
  public playRotateAnimation(): void {
    // Rotation effect
    this.scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 300,
      onComplete: () => {
        this.angle = 0;
        this.candyData.isRotating = false;
      }
    });
  }
  
  public playDestroyAnimation(): void {
    // Explosion effect for destroying
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.destroy();
      }
    });
    
    // Add explosion particles
    const particles = this.scene.add.particles(0, 0, 'particle');
    
    particles.createEmitter({
      x: this.x,
      y: this.y,
      quantity: 20,
      tint: CANDY_COLORS[this.candyData.type],
      alpha: { start: 1, end: 0 },
      scale: { start: 0.4, end: 0 },
      speed: { min: 50, max: 150 },
      lifespan: 500,
      blendMode: 'ADD',
      emitting: true,
      one: true
    });
    
    // Destroy particles after animation
    this.scene.time.delayedCall(500, () => {
      particles.destroy();
    });
  }
  
  public getCandyData(): CandyData {
    return this.candyData;
  }
  
  public isSpecial(): boolean {
    return this.candyData.specialType !== SpecialCandyType.NONE;
  }
  
  public getSpecialType(): SpecialCandyType {
    return this.candyData.specialType;
  }

  public setSelected(selected: boolean): void {
    if (selected) {
      this.setTint(0xffffff);
      this.setScale((CANDY_SIZE / this.width) * 1.1);
    } else {
      this.clearTint();
      this.setScale(CANDY_SIZE / this.width);
    }
  }

  public getRow(): number {
    return this.candyData.row;
  }

  public getCol(): number {
    return this.candyData.col;
  }

  public moveTo(row: number, col: number): void {
    this.candyData.row = row;
    this.candyData.col = col;
    this.candyData.x = col * CANDY_SIZE + CANDY_SIZE / 2;
    this.candyData.y = row * CANDY_SIZE + CANDY_SIZE / 2;
    this.x = this.candyData.x;
    this.y = this.candyData.y;
  }

  public isIdle(): boolean {
    return !this.candyData.isSwapping && 
           !this.candyData.isDropping && 
           !this.candyData.isRotating && 
           !this.candyData.isDestroyed;
  }
} 