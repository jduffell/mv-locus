export class Camera {
  constructor(onChange) {
    this.pos = { x: 0, y: 0 };
    this.vel = { x: 0, y: 0 };
    this.zoom = 1.0;
    this.friction = 0.92;
    this.onChange = onChange;
    this._startLoop();
  }

  pan(dx, dy) {
    this.pos.x += dx / this.zoom;
    this.pos.y += dy / this.zoom;
    this.vel.x = dx; // Record velocity for inertia
    this.vel.y = dy;
  }

  _startLoop() {
    const update = () => {
      if (Math.abs(this.vel.x) > 0.01 || Math.abs(this.vel.y) > 0.01) {
        this.pos.x += this.vel.x / this.zoom;
        this.pos.y += this.vel.y / this.zoom;
        this.vel.x *= this.friction;
        this.vel.y *= this.friction;
        this.onChange();
      }
      requestAnimationFrame(update);
    };
    update();
  }
}
