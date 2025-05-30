import Phaser from 'phaser';
import { CANDY_COLORS, CANDY_SIZE, SpecialCandyType } from '../config';
import type { CandyData } from '../utils/helpers';

export class Candy extends Phaser.GameObjects.Container {
  public candyData: CandyData;
  private shape: Phaser.GameObjects.Graphics;
  private specialEffect: Phaser.GameObjects.Sprite | null = null;
  private specialParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  
  constructor(scene: Phaser.Scene, candyData: CandyData) {
    super(scene, candyData.x, candyData.y);
    this.candyData = candyData;
    
    // Draw the shape for this candy type
    this.shape = this.drawCandyShape(candyData.type);
    this.add(this.shape);
    this.setSize(CANDY_SIZE, CANDY_SIZE);
    this.setInteractive(new Phaser.Geom.Circle(CANDY_SIZE/2, CANDY_SIZE/2, CANDY_SIZE/2), Phaser.Geom.Circle.Contains);
    scene.add.existing(this);
    
    // Create special effect if needed
    this.updateSpecialEffect();
    
    // Add hover effect
    this.on('pointerover', () => {
      if (!this.candyData.isSwapping && !this.candyData.isDropping && !this.candyData.isRotating) {
        this.setScale(1.1);
      }
    });
    
    this.on('pointerout', () => {
      if (!this.candyData.isSwapping && !this.candyData.isDropping && !this.candyData.isRotating) {
        this.setScale(1);
      }
    });
  }
  
  private drawCandyShape(type: number): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    graphics.clear();
    const color = CANDY_COLORS[type % CANDY_COLORS.length];
    graphics.fillStyle(color, 1);
    graphics.lineStyle(4, 0xffffff, 0.5);
    const cx = CANDY_SIZE / 2;
    const cy = CANDY_SIZE / 2;
    const r = CANDY_SIZE / 2 - 4;
    switch (type) {
      case 0: // Circle
        graphics.fillCircle(cx, cy, r);
        graphics.strokeCircle(cx, cy, r);
        break;
      case 1: // Star
        this.drawStar(graphics, cx, cy, r, 5);
        break;
      case 2: // Hexagon
        this.drawPolygon(graphics, cx, cy, r, 6);
        break;
      case 3: // Diamond
        this.drawDiamond(graphics, cx, cy, r);
        break;
      case 4: // Rounded square
        this.drawRoundedRect(graphics, cx - r, cy - r, r * 2, r * 2, 12);
        break;
      case 5: // Triangle
        this.drawPolygon(graphics, cx, cy, r, 3);
        break;
      default:
        graphics.fillCircle(cx, cy, r);
        graphics.strokeCircle(cx, cy, r);
    }
    return graphics;
  }
  
  private drawStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, points: number) {
    const step = Math.PI / points;
    g.beginPath();
    for (let i = 0; i < 2 * points + 1; i++) {
      const rad = i * step;
      const len = i % 2 === 0 ? r : r / 2;
      const x = cx + Math.cos(rad - Math.PI/2) * len;
      const y = cy + Math.sin(rad - Math.PI/2) * len;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();
  }
  
  private drawPolygon(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, sides: number) {
    g.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();
  }
  
  private drawDiamond(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number) {
    g.beginPath();
    g.moveTo(cx, cy - r);
    g.lineTo(cx + r, cy);
    g.lineTo(cx, cy + r);
    g.lineTo(cx - r, cy);
    g.closePath();
    g.fillPath();
    g.strokePath();
  }
  
  private drawRoundedRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, radius: number) {
    g.fillRoundedRect(x, y, w, h, radius);
    g.strokeRoundedRect(x, y, w, h, radius);
  }
  
  public update(candyData: CandyData): void {
    this.candyData = candyData;
    this.x = candyData.x;
    this.y = candyData.y;
    // Redraw shape if type changed
    this.remove(this.shape);
    this.shape = this.drawCandyShape(candyData.type);
    this.add(this.shape);
    
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
    const particles = this.scene.add.particles(0, 0, 'particle', {
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
    this.specialParticles = particles;
  }
  
  public playSwapAnimation(): void {
    // Scale up and down for swap animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        this.setScale(1);
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
      this.setAlpha(0.7);
      this.setScale(1.15);
    } else {
      this.setAlpha(1);
      this.setScale(1);
    }
  }

  public getRow(): number {
    return this.candyData.row;
  }

  public getCol(): number {
    return this.candyData.col;
  }

  public moveToCell(row: number, col: number): void {
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