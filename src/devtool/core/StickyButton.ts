export interface StickyButtonOptions {
  onClick?: () => void;
}

export class StickyButton {
  private button: HTMLButtonElement | null = null;
  private isDragging = false;
  private wasDragging = false;
  private offsetX = 0;
  private offsetY = 0;
  private storageKey = 'pplx-sticky-btn-position';
  private onClickCallback: () => void;

  constructor(options: StickyButtonOptions = {}) {
    this.onClickCallback = options.onClick || (() => {});
  }

  init() {
    this.create();
    this.restore();
    this.attachEvents();
  }

  private create() {
    this.button = document.createElement('button');
    this.button.id = 'pplx-sticky-btn';
    this.button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
              stroke="currentColor" stroke-width="2"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" 
              stroke="currentColor" stroke-width="2"/>
      </svg>
      <span>API</span>
    `;

    this.button.style.cssText = `
      position: fixed;
      width: 60px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      color: #fff;
      cursor: grab;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      touch-action: none;
    `;

    document.body.appendChild(this.button);
  }

  private attachEvents() {
    if (!this.button) return;

    // Desktop drag
    this.button.addEventListener('mousedown', this.onDragStart.bind(this));
    document.addEventListener('mousemove', this.onDrag.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));

    // Mobile touch
    this.button.addEventListener('touchstart', this.onDragStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.onDrag.bind(this), { passive: false });
    document.addEventListener('touchend', this.onDragEnd.bind(this));

    // Click handler
    this.button.addEventListener('click', () => {
      if (!this.wasDragging) {
        this.onClickCallback();
      }
      this.wasDragging = false;
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.snapToEdge(false);
    });
  }

  private onDragStart(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    if (!this.button) return;

    this.isDragging = true;
    this.wasDragging = false;
    this.button.style.cursor = 'grabbing';
    this.button.style.transition = 'none';

    const touch = 'touches' in e ? e.touches[0] : e;
    if (!touch) return;
    
    const rect = this.button.getBoundingClientRect();

    this.offsetX = touch.clientX - rect.left;
    this.offsetY = touch.clientY - rect.top;
  }

  private onDrag(e: MouseEvent | TouchEvent) {
    if (!this.isDragging || !this.button) return;

    e.preventDefault();
    this.wasDragging = true;

    const touch = 'touches' in e ? e.touches[0] : e;
    if (!touch) return;
    
    const x = touch.clientX - this.offsetX;
    const y = touch.clientY - this.offsetY;

    const maxX = window.innerWidth - this.button.offsetWidth;
    const maxY = window.innerHeight - this.button.offsetHeight;

    const constrainedX = Math.max(0, Math.min(x, maxX));
    const constrainedY = Math.max(0, Math.min(y, maxY));

    this.button.style.left = constrainedX + 'px';
    this.button.style.top = constrainedY + 'px';
    this.button.style.right = 'auto';
    this.button.style.bottom = 'auto';
  }

  private onDragEnd() {
    if (!this.isDragging || !this.button) return;

    this.isDragging = false;
    this.button.style.cursor = 'grab';
    this.button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    this.snapToEdge();
    this.save();
  }

  private snapToEdge(animate = true) {
    if (!this.button) return;

    const rect = this.button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const distances = {
      left: centerX,
      right: vw - centerX,
      top: centerY,
      bottom: vh - centerY,
    };

    const nearestEdge = Object.keys(distances).reduce((a, b) =>
      distances[a as keyof typeof distances] < distances[b as keyof typeof distances] ? a : b
    );

    if (!animate) {
      this.button.style.transition = 'none';
    }

    switch (nearestEdge) {
      case 'left':
        this.button.style.left = '20px';
        this.button.style.right = 'auto';
        this.button.style.top = rect.top + 'px';
        this.button.style.bottom = 'auto';
        break;
      case 'right':
        this.button.style.right = '20px';
        this.button.style.left = 'auto';
        this.button.style.top = rect.top + 'px';
        this.button.style.bottom = 'auto';
        break;
      case 'top':
        this.button.style.top = '20px';
        this.button.style.bottom = 'auto';
        this.button.style.left = rect.left + 'px';
        this.button.style.right = 'auto';
        break;
      case 'bottom':
        this.button.style.bottom = '20px';
        this.button.style.top = 'auto';
        this.button.style.left = rect.left + 'px';
        this.button.style.right = 'auto';
        break;
    }

    if (!animate) {
      setTimeout(() => {
        if (this.button) {
          this.button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
      }, 50);
    }
  }

  private save() {
    if (!this.button) return;

    const position = {
      left: this.button.style.left,
      right: this.button.style.right,
      top: this.button.style.top,
      bottom: this.button.style.bottom,
      timestamp: Date.now(),
    };

    localStorage.setItem(this.storageKey, JSON.stringify(position));
  }

  private restore() {
    const saved = localStorage.getItem(this.storageKey);

    if (saved && this.button) {
      try {
        const position = JSON.parse(saved);
        this.button.style.left = position.left;
        this.button.style.right = position.right;
        this.button.style.top = position.top;
        this.button.style.bottom = position.bottom;
      } catch (e) {
        console.error('[PPLX Sticky] Failed to restore position:', e);
        this.setDefaultPosition();
      }
    } else {
      this.setDefaultPosition();
    }
  }

  private setDefaultPosition() {
    if (!this.button) return;
    this.button.style.right = '20px';
    this.button.style.top = '50%';
    this.button.style.transform = 'translateY(-50%)';
  }
}
