/* ============================================
   Neobotics NeoRacer Screensaver Engine
   Dynamic Wind Lines Background + HUD + reveal
   ============================================ */
(function(){
  'use strict';

  const CONFIG = {
    reveal: { radiusVw: 7.5, softEdgeVw: 2.8 },
  };

  const state = { time: 0, frameCount: 0 };

  // ── DOM ──
  const bgCanvas = document.getElementById('bgCanvas');
  const bgCtx = bgCanvas.getContext('2d');
  const revealCanvas = document.getElementById('revealCanvas');
  const revealCtx = revealCanvas.getContext('2d');
  const lineartCanvas = document.getElementById('lineartCanvas');
  const lineartCtx = lineartCanvas.getContext('2d');
  const carContainer = document.getElementById('carContainer');
  const cursorEl = document.getElementById('cursor');
  const hintEl = document.getElementById('hint');

  let mx = -9999, my = -9999, active = false;

  // ── Image Processing ──
  function removeWhiteBackground(img) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height), data = d.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const br = (r+g+b)/3, mx2 = Math.max(r,g,b), mn = Math.min(r,g,b);
      const sat = mx2 === 0 ? 0 : (mx2-mn)/mx2;
      if (br > 220 && sat < 0.15) data[i+3] = 0;
      else if (br > 180 && sat < 0.2) data[i+3] = Math.round(data[i+3]*(1-(br-180)/40));
    }
    ctx.putImageData(d, 0, 0);
    return c;
  }

  // ── Load Images ──
  let processedRender = null, processedLineart = null;
  let imagesReady = false, imagesLoaded = 0;
  let renderTransform = null;

  function computeRenderTransform(cW, cH) {
    const re = { x: 1206/3300, y: 892/2550, w: 874/3300, h: 701/2550 };
    const dw = cW / re.w, dh = cH / re.h;
    renderTransform = { dx: -re.x * dw, dy: -re.y * dh, dw, dh };
  }

  function onImageLoaded() { if (++imagesLoaded === 2) { imagesReady = true; resizeCarCanvases(); } }

  const renderImg = new Image();
  renderImg.src = 'assets/render.png';
  renderImg.onload = () => { processedRender = removeWhiteBackground(renderImg); onImageLoaded(); };

  const lineartImg = new Image();
  lineartImg.src = 'assets/lineart.png';
  lineartImg.onload = () => { processedLineart = removeWhiteBackground(lineartImg); onImageLoaded(); };

  // ===============================
  // DYNAMIC WIND LINES BACKGROUND
  // ===============================

  let windLines = [];

  // Wind lines spawn from all 8 directions
  const DIRECTIONS = [
    { spawn: (W, H) => ({ x: -50, y: Math.random() * H }),                     vx: 1, vy: 0 },
    { spawn: (W, H) => ({ x: W + 50, y: Math.random() * H }),                  vx: -1, vy: 0 },
    { spawn: (W, H) => ({ x: Math.random() * W, y: -50 }),                     vx: 0, vy: 1 },
    { spawn: (W, H) => ({ x: Math.random() * W, y: H + 50 }),                  vx: 0, vy: -1 },
    { spawn: (W, H) => { const r = Math.random(); return r < 0.5 ? { x: -50, y: Math.random() * H * 0.7 } : { x: Math.random() * W * 0.7, y: -50 }; }, vx: 0.707, vy: 0.707 },
    { spawn: (W, H) => { const r = Math.random(); return r < 0.5 ? { x: W + 50, y: Math.random() * H * 0.7 } : { x: W * 0.3 + Math.random() * W * 0.7, y: -50 }; }, vx: -0.707, vy: 0.707 },
    { spawn: (W, H) => { const r = Math.random(); return r < 0.5 ? { x: -50, y: H * 0.3 + Math.random() * H * 0.7 } : { x: Math.random() * W * 0.7, y: H + 50 }; }, vx: 0.707, vy: -0.707 },
    { spawn: (W, H) => { const r = Math.random(); return r < 0.5 ? { x: W + 50, y: H * 0.3 + Math.random() * H * 0.7 } : { x: W * 0.3 + Math.random() * W * 0.7, y: H + 50 }; }, vx: -0.707, vy: -0.707 },
  ];

  function createWindLine(W, H) {
    const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    const pos = dir.spawn(W, H);
    const speed = 1.5 + Math.random() * 4;
    const curvature = (Math.random() - 0.5) * 0.3;
    const length = 60 + Math.random() * 200;
    const thickness = 1 + Math.random() * 1.5;
    const brightness = 0.35 + Math.random() * 0.5;

    return {
      trail: [{ x: pos.x, y: pos.y }],
      x: pos.x,
      y: pos.y,
      vx: dir.vx * speed,
      vy: dir.vy * speed,
      curvature,
      maxTrail: Math.floor(length),
      thickness,
      brightness,
      alpha: 0,
      fadeIn: true,
      life: 0,
      maxLife: 300 + Math.random() * 500,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.05,
      glowSize: 6 + Math.random() * 14,
    };
  }

  function initWindLines() {
    windLines = [];
    const W = bgCanvas.width, H = bgCanvas.height;
    const count = W < 768 ? 15 : 30;
    for (let i = 0; i < count; i++) {
      const line = createWindLine(W, H);
      // Pre-simulate so lines are already on screen at start
      line.life = Math.random() * line.maxLife * 0.5;
      const steps = Math.floor(Math.random() * line.maxTrail);
      for (let s = 0; s < steps; s++) {
        line.x += line.vx;
        line.y += line.vy;
        line.vx += line.curvature * 0.01;
        line.vy += line.curvature * 0.01;
        line.trail.push({ x: line.x, y: line.y });
        if (line.trail.length > line.maxTrail) line.trail.shift();
      }
      line.alpha = 0.8 + Math.random() * 0.2;
      line.fadeIn = false;
      windLines.push(line);
    }
  }

  function updateAndDrawWindLines() {
    const W = bgCanvas.width, H = bgCanvas.height;
    const mobile = W < 768;
    const targetCount = mobile ? 15 : 30;
    const t = state.time;

    // Spawn replacements
    while (windLines.length < targetCount) {
      windLines.push(createWindLine(W, H));
    }

    bgCtx.save();
    bgCtx.lineCap = 'round';
    bgCtx.lineJoin = 'round';

    for (let i = windLines.length - 1; i >= 0; i--) {
      const line = windLines[i];
      line.life++;
      line.pulsePhase += line.pulseSpeed;

      // Wind turbulence
      const wobbleX = Math.sin(t * 0.3 + line.pulsePhase) * 0.15;
      const wobbleY = Math.cos(t * 0.25 + line.pulsePhase * 1.3) * 0.15;
      line.vx += line.curvature * 0.01 + wobbleX * 0.01;
      line.vy += line.curvature * 0.01 + wobbleY * 0.01;

      line.x += line.vx;
      line.y += line.vy;
      line.trail.push({ x: line.x, y: line.y });
      if (line.trail.length > line.maxTrail) line.trail.shift();

      // Fade in/out
      if (line.fadeIn) {
        line.alpha = Math.min(1, line.alpha + 0.03);
        if (line.alpha >= 1) line.fadeIn = false;
      }
      if (line.life > line.maxLife - 60) {
        line.alpha = Math.max(0, line.alpha - 0.017);
      }

      // Remove dead or off-screen lines
      const margin = 250;
      if (line.x < -margin || line.x > W + margin || line.y < -margin || line.y > H + margin || line.life > line.maxLife) {
        windLines.splice(i, 1);
        continue;
      }

      if (line.trail.length < 2) continue;

      const pulse = 0.6 + 0.4 * Math.sin(line.pulsePhase);
      const baseAlpha = line.alpha * line.brightness * pulse;

      // Outer glow pass
      bgCtx.globalCompositeOperation = 'lighter';
      bgCtx.lineWidth = line.thickness + line.glowSize;
      bgCtx.beginPath();
      bgCtx.moveTo(line.trail[0].x, line.trail[0].y);
      for (let j = 1; j < line.trail.length; j++) {
        bgCtx.lineTo(line.trail[j].x, line.trail[j].y);
      }
      bgCtx.strokeStyle = `rgba(255, 30, 20, ${baseAlpha * 0.15})`;
      bgCtx.stroke();

      // Core line with per-segment fade
      bgCtx.globalCompositeOperation = 'lighter';
      bgCtx.lineWidth = line.thickness;
      for (let j = 1; j < line.trail.length; j++) {
        const segT = j / line.trail.length;
        const segAlpha = segT * baseAlpha;
        const r = 180 + Math.floor(75 * segT);
        bgCtx.beginPath();
        bgCtx.moveTo(line.trail[j - 1].x, line.trail[j - 1].y);
        bgCtx.lineTo(line.trail[j].x, line.trail[j].y);
        bgCtx.strokeStyle = `rgba(${r}, ${20 + Math.floor(20 * segT)}, ${10 + Math.floor(15 * segT)}, ${segAlpha})`;
        bgCtx.stroke();
      }

      // Bright glowing head
      const head = line.trail[line.trail.length - 1];
      const headR = line.glowSize * 1.5;
      const headGlow = bgCtx.createRadialGradient(head.x, head.y, 0, head.x, head.y, headR);
      headGlow.addColorStop(0, `rgba(255, 60, 40, ${baseAlpha * 0.6})`);
      headGlow.addColorStop(0.4, `rgba(255, 30, 15, ${baseAlpha * 0.25})`);
      headGlow.addColorStop(1, 'rgba(255, 15, 10, 0)');
      bgCtx.globalCompositeOperation = 'lighter';
      bgCtx.fillStyle = headGlow;
      bgCtx.fillRect(head.x - headR, head.y - headR, headR * 2, headR * 2);
    }

    bgCtx.restore();
  }

  function drawVignette() {
    const W = bgCanvas.width, H = bgCanvas.height;
    const gr = bgCtx.createRadialGradient(W * 0.5, H * 0.5, W * 0.25, W * 0.5, H * 0.5, W * 0.7);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(0,0,0,0.5)');
    bgCtx.fillStyle = gr;
    bgCtx.fillRect(0, 0, W, H);
  }

  // ===============================
  // CAR REVEAL SYSTEM
  // ===============================

  function resizeCarCanvases() {
    const rect = carContainer.getBoundingClientRect();
    const dpr = window.devicePixelRatio;
    const w = rect.width*dpr, h = rect.height*dpr;
    revealCanvas.width=w; revealCanvas.height=h;
    revealCanvas.style.width=rect.width+'px'; revealCanvas.style.height=rect.height+'px';
    lineartCanvas.width=w; lineartCanvas.height=h;
    lineartCanvas.style.width=rect.width+'px'; lineartCanvas.style.height=rect.height+'px';
    computeRenderTransform(w, h);
  }

  function drawLineart(lx, ly, opacity) {
    if (!processedLineart) return;
    const rect = carContainer.getBoundingClientRect();
    const dpr = window.devicePixelRatio;
    const w=lineartCanvas.width, h=lineartCanvas.height;
    lineartCtx.clearRect(0,0,w,h);
    lineartCtx.globalCompositeOperation='source-over';
    lineartCtx.drawImage(processedLineart,0,0,w,h);
    if (opacity > 0) {
      const localX=(lx-rect.left)*dpr, localY=(ly-rect.top)*dpr;
      const vw = window.innerWidth;
      const radius=(CONFIG.reveal.radiusVw/100)*vw*dpr, soft=(CONFIG.reveal.softEdgeVw/100)*vw*dpr;
      lineartCtx.globalCompositeOperation='destination-out';
      const gr=lineartCtx.createRadialGradient(localX,localY,Math.max(0,radius-soft),localX,localY,radius);
      gr.addColorStop(0,`rgba(0,0,0,${opacity*0.7})`);gr.addColorStop(1,'rgba(0,0,0,0)');
      lineartCtx.fillStyle=gr;lineartCtx.beginPath();lineartCtx.arc(localX,localY,radius,0,Math.PI*2);lineartCtx.fill();
      lineartCtx.globalCompositeOperation='source-over';
    }
  }

  function drawReveal(lx, ly, opacity) {
    if (!processedRender || !renderTransform) return;
    const rect = carContainer.getBoundingClientRect();
    const dpr = window.devicePixelRatio;
    const localX=(lx-rect.left)*dpr, localY=(ly-rect.top)*dpr;
    const vw = window.innerWidth;
    const radius=(CONFIG.reveal.radiusVw/100)*vw*dpr, soft=(CONFIG.reveal.softEdgeVw/100)*vw*dpr;
    revealCtx.clearRect(0,0,revealCanvas.width,revealCanvas.height);
    if (opacity <= 0) return;
    revealCtx.save();
    revealCtx.globalAlpha=opacity;
    const {dx,dy,dw,dh}=renderTransform;
    revealCtx.drawImage(processedRender,0,0,processedRender.width,processedRender.height,dx,dy,dw,dh);
    revealCtx.globalCompositeOperation='destination-in';
    const gr=revealCtx.createRadialGradient(localX,localY,Math.max(0,radius-soft),localX,localY,radius);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');
    revealCtx.fillStyle=gr;revealCtx.beginPath();revealCtx.arc(localX,localY,radius,0,Math.PI*2);revealCtx.fill();
    revealCtx.restore();
  }

  // ===============================
  // RESIZE & INPUT
  // ===============================

  function resize() {
    bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight;
    initWindLines();
    if (imagesReady) resizeCarCanvases();
  }

  function enter(x, y) {
    mx = x; my = y; active = true;
    cursorEl.classList.add('active');
    cursorEl.style.left = x+'px'; cursorEl.style.top = y+'px';
    hintEl.classList.add('hide');
  }
  function leave() {
    mx = -9999; my = -9999; active = false;
    cursorEl.classList.remove('active');
    hintEl.classList.remove('hide');
  }

  document.addEventListener('mousemove', e => enter(e.clientX, e.clientY));
  document.addEventListener('mouseleave', leave);
  document.addEventListener('touchmove', e => { e.preventDefault(); const t=e.touches[0]; enter(t.clientX,t.clientY); }, {passive:false});
  document.addEventListener('touchend', leave);

  // ===============================
  // MAIN LOOP
  // ===============================

  function animate() {
    state.time += 0.016;
    state.frameCount++;
    const W=bgCanvas.width, H=bgCanvas.height;

    bgCtx.globalCompositeOperation = 'source-over';
    bgCtx.fillStyle = '#030306';
    bgCtx.fillRect(0, 0, W, H);

    updateAndDrawWindLines();

    bgCtx.globalCompositeOperation = 'source-over';
    drawVignette();

    if (imagesReady) {
      const opacity = active ? 1 : 0;
      drawLineart(mx, my, opacity);
      drawReveal(mx, my, opacity);
    }

    requestAnimationFrame(animate);
  }

  function updateHint() {
    hintEl.textContent = window.innerWidth <= 768 ? '[ TAP TO REVEAL ]' : '[ MOVE CURSOR TO REVEAL ]';
  }

  window.addEventListener('resize', () => { resize(); updateHint(); });
  resize();
  updateHint();
  requestAnimationFrame(animate);
})();
