/**
 * Imperative canvas confetti for enrollment / completion celebrations.
 *
 * Party-popper style: cannons in the bottom corners blast colorful paper
 * pieces across the screen, then a big multi-shape bomb pops in the center.
 * Pieces tumble, flutter, and drift down like real confetti. Lives outside
 * the React tree (appended to document.body) so the celebration survives
 * the route change that follows a successful enroll. No-ops under
 * prefers-reduced-motion; cleans itself up when the last piece settles.
 */

// Brand blues + festive extras — saturated so pieces read clearly on white.
const COLORS = [
  '#2563eb', // primary blue
  '#60a5fa',
  '#1fa8f8', // accent blue
  '#10b981', // success green
  '#f59e0b', // gold
  '#fbbf24',
  '#ef4444', // red
  '#a855f7', // purple
  '#ec4899', // pink
];

const GRAVITY = 900; // px/s²

/** rect = classic square-ish paper; ribbon = long streamer; circle = round dot. */
type Shape = 'rect' | 'ribbon' | 'circle';

interface Piece {
  shape: Shape;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  /** In-plane spin. */
  rot: number;
  rotSpeed: number;
  /** Out-of-plane tumble — folds the drawn shape for a 3D flutter. */
  flip: number;
  flipSpeed: number;
  /** Per-piece air resistance — bleeds off the cannon blast. */
  air: number;
  /** Terminal fall speed (px/s) → slow, paper-like descent. */
  maxFall: number;
  sway: number;
  swaySpeed: number;
  life: number;
  ttl: number;
}

interface Volley {
  delay: number;
  fire: () => void;
}

let active: ConfettiShow | null = null;

function pickShape(ribbonBias: number): Shape {
  const r = Math.random();
  if (r < ribbonBias) return 'ribbon';
  if (r < ribbonBias + 0.12) return 'circle';
  return 'rect';
}

class ConfettiShow {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pieces: Piece[] = [];
  private volleys: Volley[] = [];
  private last = 0;
  private raf = 0;
  private onResize = () => this.fit();

  constructor() {
    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '9999',
    } satisfies Partial<CSSStyleDeclaration>);
    this.canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    this.fit();
    window.addEventListener('resize', this.onResize);
    this.raf = requestAnimationFrame((t) => {
      this.last = t;
      this.tick(t);
    });
  }

  queue(volley: Volley) {
    this.volleys.push(volley);
  }

  private spawn(
    x: number,
    y: number,
    angle: number,
    speed: number,
    scale: number,
    ribbonBias: number,
  ) {
    const shape = pickShape(ribbonBias);
    const ttl = 3.2 + Math.random() * 1.8;
    const base: Piece = {
      shape,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: (8 + Math.random() * 8) * scale,
      h: (10 + Math.random() * 12) * scale,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 14,
      flip: Math.random() * Math.PI * 2,
      flipSpeed: 6 + Math.random() * 10,
      air: 1.4 + Math.random() * 1.2,
      maxFall: 150 + Math.random() * 130,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 2 + Math.random() * 3,
      life: ttl,
      ttl,
    };
    if (shape === 'ribbon') {
      // Long thin streamers: slower tumble, floatier fall.
      base.w = (4.5 + Math.random() * 2.5) * scale;
      base.h = (22 + Math.random() * 16) * scale;
      base.flipSpeed = 3.5 + Math.random() * 4;
      base.maxFall = 110 + Math.random() * 90;
    } else if (shape === 'circle') {
      base.w = (5 + Math.random() * 4) * scale;
      base.h = base.w;
    }
    this.pieces.push(base);
  }

  /** Cone burst from (x, y) aimed at `angle` (radians, -PI/2 = straight up). */
  burst(x: number, y: number, angle: number, count: number, power: number) {
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * 1.1; // ~±32° cone
      const speed = power * (0.45 + Math.random() * 0.75);
      this.spawn(x, y, a, speed, 1, 0.18);
    }
  }

  /**
   * The big detailed one: a 360° bomb that pops mid-screen — larger pieces,
   * extra streamers, and a dense slow-moving core so it reads as a full
   * exploding shell rather than a spray.
   */
  burstBomb(x: number, y: number, count: number, power: number) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      // Two rings: a fast outer shell and a dense floaty core.
      const outer = i % 3 !== 0;
      const speed = power * (outer ? 0.5 + Math.random() * 0.5 : 0.12 + Math.random() * 0.25);
      this.spawn(x, y, a, speed, 1.25, 0.3);
      // Slight upward kick so the bomb blooms above its origin.
      this.pieces[this.pieces.length - 1].vy -= power * 0.12;
    }
  }

  private fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(window.innerWidth * dpr);
    this.canvas.height = Math.round(window.innerHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private tick = (now: number) => {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    const ctx = this.ctx;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, window.innerWidth, h);

    for (let i = this.volleys.length - 1; i >= 0; i--) {
      const v = this.volleys[i];
      v.delay -= dt;
      if (v.delay <= 0) {
        this.volleys.splice(i, 1);
        v.fire();
      }
    }

    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const p = this.pieces[i];
      p.life -= dt;
      if (p.life <= 0 || p.y > h + 40) {
        this.pieces.splice(i, 1);
        continue;
      }
      // Air resistance bleeds off the cannon blast; the fall-speed cap
      // gives the "pop, then float" feel of real paper confetti.
      const drag = Math.exp(-p.air * dt);
      p.vx *= drag;
      p.vy = Math.min(p.vy * drag + GRAVITY * dt, p.maxFall);
      p.sway += p.swaySpeed * dt;
      p.x += p.vx * dt + Math.sin(p.sway) * 40 * dt;
      p.y += p.vy * dt;
      p.rot += p.rotSpeed * dt;
      p.flip += p.flipSpeed * dt;

      const fade = p.life / p.ttl;
      ctx.globalAlpha = fade < 0.25 ? fade / 0.25 : 1;
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const fold = Math.abs(Math.cos(p.flip));
      if (p.shape === 'ribbon') {
        // Streamers fold across their width, staying long.
        const tw = Math.max(p.w * fold, 1.2);
        ctx.fillRect(-tw / 2, -p.h / 2, tw, p.h);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w / 2, Math.max((p.w / 2) * fold, 1), 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const th = Math.max(p.h * fold, 1.5);
        ctx.fillRect(-p.w / 2, -th / 2, p.w, th);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (this.volleys.length > 0 || this.pieces.length > 0) {
      this.raf = requestAnimationFrame(this.tick);
    } else {
      this.destroy();
    }
  };

  private destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.canvas.remove();
    if (active === this) active = null;
  }
}

/**
 * Fire a party-popper confetti celebration over the whole viewport:
 * cannons from both bottom corners, a center pop, then a big detailed
 * 360° bomb mid-screen, with a final corner volley. Safe to call from
 * anywhere (including right before a navigate) — the overlay outlives
 * the calling component.
 *
 * @param intensity 1 = default; scale up/down for bigger/smaller pops.
 */
export function launchConfetti(intensity = 1) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!active) active = new ConfettiShow();
  const show = active;

  const w = window.innerWidth;
  const h = window.innerHeight;
  const n = Math.round(70 * intensity);
  const power = Math.max(h, 640) * 2.15;

  // Corner cannons aimed up-and-inward, like party poppers on a desk.
  show.burst(-10, h + 10, -Math.PI / 3, n, power);
  show.burst(w + 10, h + 10, -Math.PI + Math.PI / 3, n, power);
  // Center pop straight up, slightly delayed — reads as an echo.
  show.queue({
    delay: 0.35,
    fire: () => show.burst(w / 2, h + 10, -Math.PI / 2, Math.round(n * 0.8), power * 0.9),
  });
  // The finale: a big detailed bomb exploding in the center of the screen.
  show.queue({
    delay: 0.6,
    fire: () => show.burstBomb(w / 2, h * 0.42, Math.round(n * 1.8), power * 0.42),
  });
  // Last corner volley so the celebration lingers a beat.
  show.queue({
    delay: 0.9,
    fire: () => {
      show.burst(-10, h + 10, -Math.PI / 3.4, Math.round(n * 0.6), power * 0.85);
      show.burst(w + 10, h + 10, -Math.PI + Math.PI / 3.4, Math.round(n * 0.6), power * 0.85);
    },
  });
}

/**
 * A small localized pop — a handful of confetti bursting upward from a
 * specific viewport point (e.g. a button that just did something nice).
 * For minor wins; the full-screen volley stays reserved for real
 * achievements so it keeps its meaning.
 */
export function launchConfettiAt(x: number, y: number, intensity = 1) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!active) active = new ConfettiShow();
  active.burst(x, y, -Math.PI / 2, Math.round(26 * intensity), 560 * Math.sqrt(intensity));
}
