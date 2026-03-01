import { useState, useEffect, useCallback, useRef } from "react";

const CELL = 20;
const COLS = 21;
const ROWS = 21;

// 0=path, 1=wall, 2=dot, 3=power pellet
const BASE_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,3,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,0,0,0,0,1,1,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,0,0,1,1,0,0,0,1,1,0,0,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,0,0,0,0,0,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,0,0,1,1,1,1,1,1,1,0,0,2,1,1,1,1],
  [1,1,1,1,2,0,0,0,0,0,0,0,0,0,0,0,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,2,0,2,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const GHOST_COLORS = ["#FF0000", "#FFB8FF", "#00FFFF", "#FFB852"];

const DIRS = {
  ArrowUp:    { x: 0,  y: -1 },
  ArrowDown:  { x: 0,  y:  1 },
  ArrowLeft:  { x: -1, y:  0 },
  ArrowRight: { x: 1,  y:  0 },
};

const ALL_DIRS = Object.values(DIRS);

function initMap() {
  return BASE_MAP.map(row => [...row]);
}

function countDots(map) {
  return map.flat().filter(c => c === 2 || c === 3).length;
}

function canMove(map, x, y) {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
  return map[y][x] !== 1;
}

const INIT_GHOSTS = [
  { x: 9,  y: 9,  dir: DIRS.ArrowUp    },
  { x: 10, y: 9,  dir: DIRS.ArrowLeft  },
  { x: 11, y: 9,  dir: DIRS.ArrowDown  },
  { x: 10, y: 10, dir: DIRS.ArrowRight },
];

const INIT_PAC = { x: 10, y: 15, dir: DIRS.ArrowLeft };

function initGameState() {
  const map = initMap();
  return {
    map,
    pacman: { ...INIT_PAC },
    nextDir: DIRS.ArrowLeft,
    ghosts: INIT_GHOSTS.map(g => ({ ...g })),
    score: 0,
    lives: 3,
    frightened: false,
    dotsLeft: countDots(map),
    mouthOpen: true,
  };
}

function moveGhost(ghost, map) {
  const opposite = { x: -ghost.dir.x, y: -ghost.dir.y };
  let choices = ALL_DIRS.filter(d =>
    !(d.x === opposite.x && d.y === opposite.y) &&
    canMove(map, ghost.x + d.x, ghost.y + d.y)
  );
  if (choices.length === 0) choices = [opposite];
  const d = choices[Math.floor(Math.random() * choices.length)];
  return {
    ...ghost,
    x: (ghost.x + d.x + COLS) % COLS,
    y: (ghost.y + d.y + ROWS) % ROWS,
    dir: d,
  };
}

function PacMan({ x, y, dir, mouthOpen }) {
  const cx = x * CELL + CELL / 2;
  const cy = y * CELL + CELL / 2;
  const r = CELL / 2 - 1;
  const angle = dir.x === 1 ? 0 : dir.x === -1 ? 180 : dir.y === 1 ? 90 : 270;
  const mouth = mouthOpen ? 30 : 5;
  const startA = ((angle + mouth) * Math.PI) / 180;
  const endA = ((angle + 360 - mouth) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startA);
  const y1 = cy + r * Math.sin(startA);
  const x2 = cx + r * Math.cos(endA);
  const y2 = cy + r * Math.sin(endA);
  return (
    <path
      d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 1,1 ${x2},${y2} Z`}
      fill="#FFE000"
    />
  );
}

function Ghost({ x, y, color, frightened }) {
  const px = x * CELL + 1;
  const py = y * CELL + 1;
  const w = CELL - 2;
  const h = CELL - 2;
  const fill = frightened ? "#2121DE" : color;
  return (
    <g>
      <rect x={px} y={py} width={w} height={h * 0.7} rx={w / 2} fill={fill} />
      <rect x={px} y={py + h * 0.5} width={w} height={h * 0.5} fill={fill} />
      {[0, 1, 2].map(i => (
        <circle key={i} cx={px + w / 6 + i * (w / 3)} cy={py + h - 2} r={w / 6} fill={fill} />
      ))}
      {!frightened && (
        <>
          <circle cx={px + w * 0.3} cy={py + h * 0.3} r={3} fill="white" />
          <circle cx={px + w * 0.7} cy={py + h * 0.3} r={3} fill="white" />
          <circle cx={px + w * 0.3 + 1} cy={py + h * 0.3 + 1} r={1.5} fill="#00f" />
          <circle cx={px + w * 0.7 + 1} cy={py + h * 0.3 + 1} r={1.5} fill="#00f" />
        </>
      )}
      {frightened && (
        <>
          <line x1={px + w * 0.2} y1={py + h * 0.6} x2={px + w * 0.4} y2={py + h * 0.5} stroke="white" strokeWidth={1.5} />
          <line x1={px + w * 0.4} y1={py + h * 0.5} x2={px + w * 0.6} y2={py + h * 0.6} stroke="white" strokeWidth={1.5} />
          <line x1={px + w * 0.6} y1={py + h * 0.6} x2={px + w * 0.8} y2={py + h * 0.5} stroke="white" strokeWidth={1.5} />
        </>
      )}
    </g>
  );
}

export default function PacManGame() {
  // All mutable game data lives in a ref to avoid stale closures in the game loop.
  const gsRef = useRef(initGameState());

  // A lightweight counter just to trigger re-renders each tick.
  const [, setTick] = useState(0);
  const forceRender = useCallback(() => setTick(t => t + 1), []);

  // gameState drives the useEffect so the interval starts/stops correctly.
  const [gameState, setGameState] = useState("waiting");

  const frightenTimerRef = useRef(null);

  // Convenience read – valid during render (not inside async callbacks).
  const gs = gsRef.current;

  // ── Reset helpers ────────────────────────────────────────────────────────────

  const resetPositions = useCallback(() => {
    const s = gsRef.current;
    s.pacman = { ...INIT_PAC };
    s.nextDir = DIRS.ArrowLeft;
    s.ghosts = INIT_GHOSTS.map(g => ({ ...g }));
    s.frightened = false;
    clearTimeout(frightenTimerRef.current);
  }, []);

  const startGame = useCallback(() => {
    gsRef.current = initGameState();
    setGameState("playing");
    forceRender();
  }, [forceRender]);

  // ── Keyboard ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      if (DIRS[e.key]) {
        e.preventDefault();
        gsRef.current.nextDir = DIRS[e.key];
        setGameState(prev => {
          if (prev === "waiting" || prev === "dead") return "playing";
          return prev;
        });
      }
      if (e.key === "Enter") {
        setGameState(prev => {
          if (prev === "waiting" || prev === "gameover" || prev === "won") {
            // startGame will run on next render; trigger it here directly.
          }
          return prev;
        });
        // Use a ref check to avoid capturing stale startGame
        startGameRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startGameRef = useRef(startGame);
  startGameRef.current = startGame;

  // ── Single unified game loop ──────────────────────────────────────────────────

  useEffect(() => {
    if (gameState !== "playing") return;

    const id = setInterval(() => {
      const s = gsRef.current;

      // Toggle mouth animation
      s.mouthOpen = !s.mouthOpen;

      // ── Move Pac-Man ────────────────────────────────────────────────────────
      const pac = s.pacman;
      const nd = s.nextDir;

      let dir = pac.dir;
      if (canMove(s.map, pac.x + nd.x, pac.y + nd.y)) dir = nd;

      let nx = pac.x + dir.x;
      let ny = pac.y + dir.y;
      if (!canMove(s.map, nx, ny)) { nx = pac.x; ny = pac.y; }
      nx = (nx + COLS) % COLS;
      ny = (ny + ROWS) % ROWS;

      s.pacman = { x: nx, y: ny, dir };

      // ── Eat dots ────────────────────────────────────────────────────────────
      const cell = s.map[ny][nx];
      if (cell === 2) {
        s.map[ny][nx] = 0;
        s.score += 10;
        s.dotsLeft -= 1;
      } else if (cell === 3) {
        s.map[ny][nx] = 0;
        s.score += 50;
        s.dotsLeft -= 1;
        s.frightened = true;
        clearTimeout(frightenTimerRef.current);
        frightenTimerRef.current = setTimeout(() => {
          gsRef.current.frightened = false;
          forceRender();
        }, 7000);
      }

      // ── Check win ───────────────────────────────────────────────────────────
      if (s.dotsLeft <= 0) {
        setGameState("won");
        forceRender();
        return;
      }

      // ── Move ghosts ─────────────────────────────────────────────────────────
      s.ghosts = s.ghosts.map(g => moveGhost(g, s.map));

      // ── Collision detection ─────────────────────────────────────────────────
      for (const g of s.ghosts) {
        if (g.x === nx && g.y === ny) {
          if (s.frightened) {
            s.score += 200;
          } else {
            s.lives -= 1;
            if (s.lives <= 0) {
              setGameState("gameover");
              forceRender();
              return;
            }
            resetPositions();
          }
          break;
        }
      }

      forceRender();
    }, 180);

    return () => clearInterval(id);
  }, [gameState, forceRender, resetPositions]);

  // ── Render ────────────────────────────────────────────────────────────────────

  const W = COLS * CELL;
  const H = ROWS * CELL;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Press Start 2P', monospace",
      color: "#FFE000",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        body { margin: 0; background: #000; }
        @keyframes pulse { from { r: 4px; } to { r: 6px; opacity: 0.6; } }
      `}</style>

      <div style={{ marginBottom: 12, fontSize: 22, letterSpacing: 4, color: "#FFE000", textShadow: "0 0 20px #FFE000" }}>
        PAC-MAN
      </div>

      <div style={{ display: "flex", gap: 40, marginBottom: 10, fontSize: 11 }}>
        <span>SCORE: <span style={{ color: "#fff" }}>{gs.score}</span></span>
        <span>LIVES: {Array(gs.lives).fill("●").join(" ")}</span>
        <span>DOTS: <span style={{ color: "#fff" }}>{gs.dotsLeft}</span></span>
      </div>

      <div style={{ position: "relative", border: "2px solid #2121de", boxShadow: "0 0 30px #2121de55" }}>
        <svg width={W} height={H}>
          {/* Map */}
          {gs.map.map((row, ry) => row.map((cell, cx) => {
            if (cell === 1) return (
              <rect key={`${ry}-${cx}`} x={cx * CELL} y={ry * CELL} width={CELL} height={CELL} fill="#2121de" rx={2} />
            );
            if (cell === 2) return (
              <circle key={`${ry}-${cx}`} cx={cx * CELL + CELL / 2} cy={ry * CELL + CELL / 2} r={2} fill="#FFE000" opacity={0.8} />
            );
            if (cell === 3) return (
              <circle key={`${ry}-${cx}`} cx={cx * CELL + CELL / 2} cy={ry * CELL + CELL / 2} r={5} fill="#FFB8AE"
                style={{ animation: "pulse 0.6s infinite alternate" }} />
            );
            return null;
          }))}

          {/* Pac-Man */}
          <PacMan x={gs.pacman.x} y={gs.pacman.y} dir={gs.pacman.dir} mouthOpen={gs.mouthOpen} />

          {/* Ghosts */}
          {gs.ghosts.map((g, i) => (
            <Ghost key={i} x={g.x} y={g.y} color={GHOST_COLORS[i]} frightened={gs.frightened} />
          ))}
        </svg>

        {/* Overlay */}
        {gameState !== "playing" && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 20,
          }}>
            {gameState === "waiting" && (
              <>
                <div style={{ fontSize: 18, color: "#FFE000" }}>PAC-MAN</div>
                <div style={{ fontSize: 9, color: "#fff", textAlign: "center", lineHeight: 2 }}>
                  使用方向鍵移動<br />吃掉所有豆子<br />避開鬼魂！
                </div>
                <div style={{ fontSize: 8, color: "#aaa" }}>按方向鍵開始</div>
              </>
            )}
            {gameState === "dead" && (
              <>
                <div style={{ fontSize: 14, color: "#f55" }}>被抓到了！</div>
                <div style={{ fontSize: 8, color: "#aaa" }}>按方向鍵繼續</div>
              </>
            )}
            {gameState === "gameover" && (
              <>
                <div style={{ fontSize: 14, color: "#f55" }}>GAME OVER</div>
                <div style={{ fontSize: 10, color: "#fff" }}>分數: {gs.score}</div>
                <button onClick={startGame} style={{
                  background: "#FFE000", color: "#000", border: "none",
                  padding: "8px 20px", fontFamily: "inherit", fontSize: 9,
                  cursor: "pointer",
                }}>再來一次</button>
              </>
            )}
            {gameState === "won" && (
              <>
                <div style={{ fontSize: 12, color: "#0f0" }}>YOU WIN!</div>
                <div style={{ fontSize: 10, color: "#fff" }}>分數: {gs.score}</div>
                <button onClick={startGame} style={{
                  background: "#FFE000", color: "#000", border: "none",
                  padding: "8px 20px", fontFamily: "inherit", fontSize: 9,
                  cursor: "pointer",
                }}>再玩一次</button>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, fontSize: 8, color: "#444", textAlign: "center", lineHeight: 2 }}>
        ⬆⬇⬅➡ 方向鍵控制 · 粉色大點 = 能量豆 · 能量豆讓鬼魂變藍可以吃掉
      </div>
    </div>
  );
}
