import React, { useState, useEffect, useRef } from 'react';
import './HandHUD.css';

const HandHUD = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState('ready');
  const [gesture, setGesture] = useState('—');
  const [fps, setFps] = useState('—');
  const [speed, setSpeed] = useState(1);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const particlesRef = useRef([]);
  const lastLandmarksRef = useRef(null);
  const tPrevRef = useRef(performance.now());
  
  const canvasWRef = useRef(960);
  const canvasHRef = useRef(540);

  // Initialize MediaPipe Hands
  useEffect(() => {
    if (!isOpen) return;

    const initHands = async () => {
      try {
        setStatus('loading…');
        
        // Load MediaPipe scripts dynamically
        await loadMediaPipeScripts();
        
        // Initialize Hands
        handsRef.current = new window.Hands({ 
          locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` 
        });
        
        handsRef.current.setOptions({ 
          maxNumHands: 1, 
          modelComplexity: 1, 
          minDetectionConfidence: 0.6, 
          minTrackingConfidence: 0.6 
        });
        
        // Define onResults function inside useEffect to avoid dependency issues
        const handleResults = (results) => {
          const now = performance.now();
          const dt = now - tPrevRef.current;
          tPrevRef.current = now;
          const currentFps = Math.round(1000 / dt);
          setFps(`fps: ${currentFps}`);
          
          lastLandmarksRef.current = (results.multiHandLandmarks && results.multiHandLandmarks[0]) || null;
          
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            
            drawCamera(ctx);
            drawGridAndCube(ctx);
            
            if (lastLandmarksRef.current) {
              drawLandmarks(ctx, lastLandmarksRef.current);
              addTrail(lastLandmarksRef.current);
              setGesture(classifyGesture(lastLandmarksRef.current));
            } else {
              setGesture('—');
            }
            
            stepParticles(ctx);
          }
        };
        
        handsRef.current.onResults(handleResults);
        
        setStatus('ready');
      } catch (error) {
        console.error('Error initializing hands:', error);
        setStatus('initialization failed');
      }
    };

    initHands();

    return () => {
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [isOpen]);

  // Load MediaPipe scripts
  const loadMediaPipeScripts = async () => {
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
    ];

    for (const scriptSrc of scripts) {
      if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = scriptSrc;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
    }
  };

  // Fit canvas to container
  const fitCanvas = () => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    canvasWRef.current = rect.width;
    canvasHRef.current = rect.height;
    canvasRef.current.width = canvasWRef.current;
    canvasRef.current.height = canvasHRef.current;
  };

  useEffect(() => {
    if (!isOpen) return;
    
    fitCanvas();
    window.addEventListener('resize', fitCanvas);
    
    return () => {
      window.removeEventListener('resize', fitCanvas);
    };
  }, [isOpen]);

  // Gesture classification helpers
  const fingerStates = (landmarks) => {
    const idx = {
      thumb_tip: 4, thumb_ip: 3, 
      index_tip: 8, index_pip: 6, 
      middle_tip: 12, middle_pip: 10, 
      ring_tip: 16, ring_pip: 14, 
      pinky_tip: 20, pinky_pip: 18
    };
    
    const tipAbove = (tip, pip) => landmarks[tip].y < landmarks[pip].y;
    const thumbExtended = Math.abs(landmarks[idx.thumb_tip].x - landmarks[idx.thumb_ip].x) > 0.05;
    
    return {
      thumb: thumbExtended,
      index: tipAbove(idx.index_tip, idx.index_pip),
      middle: tipAbove(idx.middle_tip, idx.middle_pip),
      ring: tipAbove(idx.ring_tip, idx.ring_pip),
      pinky: tipAbove(idx.pinky_tip, idx.pinky_pip)
    };
  };

  const classifyGesture = (landmarks) => {
    if (!landmarks) return '—';
    
    const states = fingerStates(landmarks);
    const up = [states.thumb, states.index, states.middle, states.ring, states.pinky].filter(Boolean).length;
    
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const pinch = distance(landmarks[4], landmarks[8]) < 0.045;
    
    if (pinch) return 'pinch';
    if (states.index && !states.middle && !states.ring && !states.pinky) return 'point';
    if (up >= 4) return 'open-palm';
    return 'unknown';
  };

  // Drawing functions
  const drawCamera = (ctx) => {
    if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, canvasWRef.current, canvasHRef.current);
    }
  };

  const drawLandmarks = (ctx, landmarks) => {
    const Sx = canvasWRef.current;
    const Sy = canvasHRef.current;
    const connections = window.HAND_CONNECTIONS || [];
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,255,255,.5)';
    
    connections.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(landmarks[a].x * Sx, landmarks[a].y * Sy);
      ctx.lineTo(landmarks[b].x * Sx, landmarks[b].y * Sy);
      ctx.stroke();
    });
    
    landmarks.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x * Sx, point.y * Sy, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,255,255,.9)';
      ctx.fill();
    });
  };

  const addTrail = (landmarks) => {
    const Sx = canvasWRef.current;
    const Sy = canvasHRef.current;
    const tip = landmarks[8];
    const x = tip.x * Sx;
    const y = tip.y * Sy;
    
    for (let i = 0; i < 6 * speed; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 2 * speed,
        vy: (Math.random() - 0.5) * 2 * speed,
        life: 1,
        r: 2 + Math.random() * 2
      });
    }
  };

  const stepParticles = (ctx) => {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const particle = particlesRef.current[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.03;
      particle.life -= 0.02;
      
      if (particle.life <= 0) {
        particlesRef.current.splice(i, 1);
        continue;
      }
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,200,255,${particle.life})`;
      ctx.fill();
    }
  };

  const drawGridAndCube = (ctx) => {
    const x0 = canvasWRef.current * 0.72;
    const y0 = canvasHRef.current * 0.65;
    const w = canvasWRef.current * 0.24;
    const h = canvasHRef.current * 0.28;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255,100,100,.5)';
    ctx.lineWidth = 1.5;
    
    // Grid
    const cols = 8, rows = 6;
    for (let i = 0; i <= cols; i++) {
      const x = x0 + (i / cols) * w;
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y0 + h);
      ctx.stroke();
    }
    
    for (let j = 0; j <= rows; j++) {
      const y = y0 + (j / rows) * h;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + w, y);
      ctx.stroke();
    }
    
    // Wire cube
    const cx = x0 + w * 0.35;
    const cy = y0 + h * 0.35;
    const size = Math.min(w, h) * 0.32;
    const d = size * 0.5;
    
    const points = [
      [-d, -d, 0], [d, -d, 0], [d, d, 0], [-d, d, 0],
      [-d * 0.7, -d * 0.7, d], [d * 0.7, -d * 0.7, d],
      [d * 0.7, d * 0.7, d], [-d * 0.7, d * 0.7, d]
    ];
    
    const project = (X, Y, Z) => [cx + X * 1.0 + Z * 0.35, cy + Y * 1.0 + Z * 0.2];
    const projectedPoints = points.map(([X, Y, Z]) => project(X, Y, Z));
    
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    
    ctx.strokeStyle = 'rgba(255,100,150,.65)';
    edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(projectedPoints[a][0], projectedPoints[a][1]);
      ctx.lineTo(projectedPoints[b][0], projectedPoints[b][1]);
      ctx.stroke();
    });
    
    // Bars
    const barsX = x0 + w * 0.05;
    const barsY = y0 + h * 0.08;
    const barW = w * 0.18;
    const barH = 6;
    const gap = 8;
    
    for (let i = 0; i < 8; i++) {
      const val = Math.abs(Math.sin((performance.now() / 600) + (i * 0.7)));
      ctx.fillStyle = 'rgba(150,200,255,.6)';
      ctx.fillRect(barsX, barsY + i * (barH + gap), barW * val, barH);
      ctx.strokeStyle = 'rgba(150,200,255,.25)';
      ctx.strokeRect(barsX, barsY + i * (barH + gap), barW, barH);
    }
    
    // Text
    ctx.fillStyle = 'rgba(210,220,255,.7)';
    ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText('friction: 0.55', x0 + w * 0.55, y0 + h * 0.15);
    ctx.fillText('signal: 92%', x0 + w * 0.55, y0 + h * 0.15 + 16);
    ctx.fillText('index-trace', x0 + w * 0.55, y0 + h * 0.15 + 32);
    
    ctx.restore();
  };



  // Start camera
  const startCamera = async () => {
    try {
      setIsCameraRunning(true);
      setStatus('starting camera…');
      
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 960,
        height: 540
      });
      
      cameraRef.current = camera;
      await camera.start();
      setStatus('camera running');
    } catch (error) {
      console.error('Camera error:', error);
      setStatus('camera blocked (allow permissions)');
      setIsCameraRunning(false);
    }
  };

  // Stop camera
  const stopCamera = async () => {
    if (cameraRef.current) {
      await cameraRef.current.stop();
      cameraRef.current = null;
    }
    setIsCameraRunning(false);
    setStatus('ready');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        stopCamera();
      }
      const currentAnimationFrame = animationFrameRef.current;
      if (currentAnimationFrame) {
        cancelAnimationFrame(currentAnimationFrame);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="hand-hud-overlay" onClick={onClose}>
      <div className="hand-hud-container" onClick={(e) => e.stopPropagation()}>
        <div className="hand-hud-header">
          <h3>Hand Tracking HUD</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="hand-hud-controls">
          <button 
            className={`control-btn ${isCameraRunning ? 'stop' : 'start'}`}
            onClick={isCameraRunning ? stopCamera : startCamera}
            disabled={status === 'loading…'}
          >
            {isCameraRunning ? 'Stop Camera' : 'Enable Camera'}
          </button>
          
          <span className="status-capsule">{status}</span>
          <span className="gesture-capsule">{gesture}</span>
          
          <label className="speed-capsule">
            Speed
            <select 
              value={speed} 
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              disabled={isCameraRunning}
            >
              <option value={0.6}>0.6x</option>
              <option value={0.8}>0.8x</option>
              <option value={1}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
              <option value={3}>3x</option>
            </select>
          </label>
        </div>
        
        <div className="hand-hud-stage">
          <video 
            ref={videoRef} 
            playsInline 
            style={{ display: 'none' }}
          />
          <canvas 
            ref={canvasRef}
            className="hand-hud-canvas"
          />
          <div className="hand-hud-hud">
            <span className="fps-capsule">{fps}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandHUD;
