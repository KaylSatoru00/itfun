import { useEffect, useRef } from 'react';

/**
 * RippleBg — WebGL water-ripple background scoped to the dark brand panel.
 *
 * Renders a low-res fragment shader that emits expanding, damped wave-rings
 * at the live cursor position, distorting the panel's dark/red radial glow.
 * Purely decorative: the canvas is pointer-events:none, so clicks on the
 * logo/badges pass straight through.
 *
 * Performance guards:
 *  - low-res render buffer (0.7x) upscaled by CSS
 *  - pointer position is rAF-coalesced (no per-mousemove draws)
 *  - render loop pauses when the tab is hidden and when the water has settled
 *  - fully disabled on touch / reduced-motion / low-core devices (static look)
 *
 * Mount it as the FIRST child of the brand panel so it paints behind the
 * blurred blobs and the brand content.
 */

const MAX_RIPPLES = 8;
const RIPPLE_TTL = 3.0;      // seconds until a ring is fully settled
const EMIT_MIN_DT = 0.045;   // s between emitted rings while dragging
const EMIT_MIN_DIST = 0.018; // normalized distance between rings

// Intensity preset "A — Subtle"
const AMP = 0.5;
const TINT = 0.35;

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform vec2 uRipplePos[8];
uniform float uRippleAge[8];
uniform float uAmp;
uniform float uTint;
vec3 baseColor(vec2 uv){
  vec3 dark = vec3(0.024, 0.024, 0.027);
  float g1 = smoothstep(1.1, 0.0, distance(uv, vec2(0.04, 0.05)) * 1.25);
  float g2 = smoothstep(1.1, 0.0, distance(uv, vec2(0.97, 1.04)) * 1.15);
  vec3 col = dark;
  col += vec3(0.78, 0.05, 0.17) * pow(g1, 2.0) * 0.45;
  col += vec3(0.60, 0.00, 0.19) * pow(g2, 2.0) * 0.30;
  return col;
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  float disp = 0.0;
  vec2 grad = vec2(0.0);
  for(int i = 0; i < 8; i++){
    float age = uRippleAge[i];
    if(age < 0.0) continue;
    vec2 p = vec2(uRipplePos[i].x, 1.0 - uRipplePos[i].y);
    vec2 d = (uv - p) * aspect;
    float r = length(d);
    float wave = sin(r * 42.0 - age * 9.0);
    float env = exp(-r * 8.5) * exp(-age * 2.4) * smoothstep(0.0, 0.08, age);
    float ring = exp(-pow((r - age * 0.32) * 13.0, 2.0));
    float h = wave * env * ring;
    disp += h;
    grad += normalize(d + 1e-5) * h;
  }
  disp *= uAmp; grad *= uAmp;
  vec2 uv2 = uv + grad * 0.03;
  vec3 col = baseColor(uv2);
  float hl = clamp(disp, 0.0, 1.0);
  col += vec3(0.85, 0.14, 0.27) * hl * uTint;
  col += vec3(1.0, 0.85, 0.88) * pow(max(disp, 0.0), 3.0) * uTint * 0.35;
  gl_FragColor = vec4(col, 1.0);
}`;

function RippleBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    // ── capability gate: skip entirely on touch / reduced-motion / low-end ──
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowCore = (navigator.hardwareConcurrency || 8) <= 4;
    if (coarse || reduced || lowCore) return;

    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false });
    if (!gl) return; // no WebGL → leave the static panel look

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const SCALE = 0.7;

    // ── program setup ──
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const pLoc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uPos = gl.getUniformLocation(prog, 'uRipplePos');
    const uAge = gl.getUniformLocation(prog, 'uRippleAge');
    gl.uniform1f(gl.getUniformLocation(prog, 'uAmp'), AMP);
    gl.uniform1f(gl.getUniformLocation(prog, 'uTint'), TINT);

    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * DPR * SCALE));
      canvas.height = Math.max(1, Math.floor(h * DPR * SCALE));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // ── ripple state ──
    const ripples = [];               // { x, y, birth }
    const posArr = new Float32Array(MAX_RIPPLES * 2);
    const ageArr = new Float32Array(MAX_RIPPLES);
    let last = { x: 0, y: 0, t: -1 }; // last emitted ripple (normalized)
    let pending = null;               // latest pointer pos, consumed in the loop
    let running = false;
    let raf = 0;

    const now = () => performance.now() / 1000;

    const emit = (x, y, t) => {
      if (last.t >= 0) {
        const dx = x - last.x, dy = y - last.y;
        if (t - last.t < EMIT_MIN_DT && Math.hypot(dx, dy) < EMIT_MIN_DIST) return;
      }
      ripples.push({ x, y, birth: t });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
      last = { x, y, t };
    };

    const frame = () => {
      const t = now();
      if (pending) { emit(pending.x, pending.y, t); pending = null; }

      // build uniform arrays; drop settled ripples
      let active = 0;
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (t - ripples[i].birth > RIPPLE_TTL) ripples.splice(i, 1);
      }
      for (let i = 0; i < MAX_RIPPLES; i++) {
        const r = ripples[i];
        if (r) {
          posArr[i * 2] = r.x; posArr[i * 2 + 1] = r.y;
          ageArr[i] = t - r.birth;
          active++;
        } else {
          ageArr[i] = -1;
        }
      }
      gl.uniform2fv(uPos, posArr);
      gl.uniform1fv(uAge, ageArr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (active > 0 && !document.hidden) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false; // settled → pause loop until next input
      }
    };

    const start = () => {
      if (running || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    // ── input ──
    const onMove = (e) => {
      const rect = host.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return; // outside panel → ignore
      pending = { x, y };
      start();
    };
    const onLeave = () => { pending = null; }; // stop emitting; rings settle out
    const onVisibility = () => { if (!document.hidden) start(); };

    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    // draw one static frame so the base glow is present before any movement
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} className="as-ripple" aria-hidden="true" />;
}

export default RippleBg;
