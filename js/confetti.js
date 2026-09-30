/**
 * confetti.js
 * Canvas-based particle explosion system for milestone celebrations.
 */
class ConfettiController {
  constructor(canvasId = 'confettiCanvas') {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animId = null;

    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  launch() {
    if (!this.canvas || !this.ctx) return;
    this.particles = [];
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

    for (let i = 0; i < 110; i++) {
      this.particles.push({
        x: this.canvas.width * (0.35 + Math.random() * 0.3),
        y: this.canvas.height * 0.45,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 14 - 4,
        gravity: 0.38,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        opacity: 1
      });
    }

    if (!this.animId) {
      this.loop();
    }
  }

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let activeCount = 0;

    for (const p of this.particles) {
      if (p.opacity <= 0.01) continue;
      activeCount++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.vRot;
      p.opacity -= 0.007;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      this.ctx.restore();
    }

    if (activeCount > 0) {
      this.animId = requestAnimationFrame(() => this.loop());
    } else {
      this.animId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}
