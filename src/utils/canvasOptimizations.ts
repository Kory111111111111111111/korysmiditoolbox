// Canvas rendering optimization utilities

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: OffscreenCanvas | HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  private isDirty = true;
  private lastRenderTime = 0;
  private renderQueue: (() => void)[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    // Create offscreen canvas for background layers
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
      this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    } else {
      // Fallback for browsers without OffscreenCanvas
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = canvas.width;
      this.offscreenCanvas.height = canvas.height;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    }
  }

  markDirty() {
    this.isDirty = true;
  }

  updateSize(width: number, height: number) {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
      this.markDirty();
    }
  }

  // Throttled rendering to improve performance
  render(renderFn: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => void, forceUpdate = false) {
    if (!this.isDirty && !forceUpdate) return;

    const now = performance.now();
    if (now - this.lastRenderTime < 16) { // ~60fps throttling
      // Schedule for next frame
      requestAnimationFrame(() => this.render(renderFn, forceUpdate));
      return;
    }

    this.renderQueue.push(() => {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Render to offscreen canvas first
      this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
      renderFn(this.offscreenCtx);
      
      // Copy to main canvas
      if (this.offscreenCanvas instanceof HTMLCanvasElement) {
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
      } else {
        // OffscreenCanvas to ImageBitmap
        createImageBitmap(this.offscreenCanvas).then(bitmap => {
          this.ctx.drawImage(bitmap, 0, 0);
          bitmap.close();
        });
      }
      
      this.isDirty = false;
      this.lastRenderTime = now;
    });

    // Process render queue
    this.processRenderQueue();
  }

  private processRenderQueue() {
    if (this.renderQueue.length === 0) return;
    
    // Batch multiple render calls
    const renderFn = this.renderQueue.pop()!;
    this.renderQueue.length = 0; // Clear queue
    
    requestAnimationFrame(() => {
      renderFn();
    });
  }

  // Optimized drawing methods
  drawRoundedRect(x: number, y: number, width: number, height: number, radius: number, ctx?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    const context = ctx || this.ctx;
    const r = Math.min(radius, height / 2, width / 2);
    
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  // Batch drawing operations for better performance
  drawNotes(notes: Array<{x: number, y: number, width: number, height: number, color: string, selected: boolean}>) {
    if (notes.length === 0) return;

    // Group by color and selection state for batch rendering
    const batches = new Map<string, typeof notes>();
    
    notes.forEach(note => {
      const key = `${note.color}-${note.selected}`;
      if (!batches.has(key)) {
        batches.set(key, []);
      }
      batches.get(key)!.push(note);
    });

    // Render each batch
    batches.forEach((batch, key) => {
      const [color, isSelected] = key.split('-');
      
      this.ctx.fillStyle = color;
      if (isSelected === 'true') {
        this.ctx.shadowColor = 'rgba(59,130,246,0.45)';
        this.ctx.shadowBlur = 10;
      }

      batch.forEach(note => {
        this.drawRoundedRect(note.x, note.y, note.width, note.height, 5);
        this.ctx.fill();
      });

      // Reset shadow
      this.ctx.shadowBlur = 0;
    });
  }

  dispose() {
    // Clean up resources
    this.renderQueue.length = 0;
  }
}

// Dirty region tracking for partial updates
export class DirtyRegion {
  private regions: Array<{x: number, y: number, width: number, height: number}> = [];
  private isDirty = false;

  addRegion(x: number, y: number, width: number, height: number) {
    this.regions.push({x, y, width, height});
    this.isDirty = true;
  }

  getDirtyBounds() {
    if (this.regions.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    this.regions.forEach(region => {
      minX = Math.min(minX, region.x);
      minY = Math.min(minY, region.y);
      maxX = Math.max(maxX, region.x + region.width);
      maxY = Math.max(maxY, region.y + region.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  clear() {
    this.regions.length = 0;
    this.isDirty = false;
  }

  get dirty() {
    return this.isDirty;
  }
}