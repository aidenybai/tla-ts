import { useEffect, useRef, useSyncExternalStore } from "react";
import { vec } from "@/lib/sandbox-figure";
import { createMazeScene, MAZE_MAP, PLAIN_PITCH, type PlainBoard, type Tried } from "./maze-scene";

const STAGE = { width: 1920, height: 1080 };
const LOOP_MS = 10_000;
// One board fills the stage for this long, and then the camera draws back.
const HOLD_MS = 900;
const STEP_MS = 170;
// The part of a step the robot spends moving to its square.
const GLIDE = 0.75;
// The steps a board rests on what its check found before it starts over.
const REST_STEPS = 12;
const SIZE = 7;
const START = { x: 0, y: 6 };
const MOVES = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];
const LAYOUTS = 32;
// The camera looks down over the middle board from in front of it, and ends this many times as
// far away as it starts.
const CAMERA = { distance: 13, drawnBack: 8, lean: vec(0, 0.766, 0.643), halfAngle: 0.344 };
// The robot's ears and cap, and the way to its square, show on boards the camera is this near.
const NEAR_DISTANCE = 45;

const subscribeToResize = (onChange: () => void) => {
  addEventListener("resize", onChange);
  return () => removeEventListener("resize", onChange);
};

const getRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    const mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    const again = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((again ^ (again >>> 14)) >>> 0) / 4_294_967_296;
  };
};

// A board of its own: the first is the example's, and each other has a heart somewhere else,
// walls round it that may leave a gap, and a few blocks in the way.
const getMap = (index: number) => {
  if (index === 0) return MAZE_MAP.map((row) => [...row]);
  const random = getRandom(index);
  const heart = { x: 2 + Math.floor(random() * 4), y: 1 + Math.floor(random() * 4) };
  const map = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => "."));
  for (const down of [-1, 0, 1])
    for (const across of [-1, 0, 1])
      if ((across === 0) !== (down === 0) || random() < 0.6)
        map[heart.y + down][heart.x + across] = "#";
  if (random() < 0.55) {
    const gap = MOVES[Math.floor(random() * MOVES.length)];
    map[heart.y + gap[1]][heart.x + gap[0]] = ".";
  }
  for (let block = 0; block < 4; block++) {
    const x = Math.floor(random() * SIZE);
    const y = Math.floor(random() * SIZE);
    if (Math.max(Math.abs(x - heart.x), Math.abs(y - heart.y)) > 1) map[y][x] = "#";
  }
  map[heart.y][heart.x] = "o";
  map[START.y][START.x] = ".";
  return map;
};

// The check of a board, as TLA-ts makes it: every square a move reaches, nearest first, until a
// move reaches the heart or there is no square left.
const getCheck = (map: string[][]) => {
  const tried: Tried[] = [{ square: START, parent: -1 }];
  const seen = new Set([`${START.x} ${START.y}`]);
  for (let index = 0; index < tried.length; index++)
    for (const move of MOVES) {
      const square = { x: tried[index].square.x + move[0], y: tried[index].square.y + move[1] };
      const kind = map[square.y]?.[square.x];
      if (kind === undefined || kind === "#" || seen.has(`${square.x} ${square.y}`)) continue;
      seen.add(`${square.x} ${square.y}`);
      tried.push({ square, parent: index });
      if (kind === "o") return { tried, hasBug: true };
    }
  return { tried, hasBug: false };
};

const LAYOUT_LIST = Array.from({ length: LAYOUTS }, (_value, index) => {
  const map = getMap(index);
  const squares = map.flatMap((row, y) => row.map((kind, x) => ({ x, y, kind })));
  return {
    map: map.map((row) => row.join("")),
    heart: squares.find((square) => square.kind === "o") ?? START,
    ...getCheck(map),
  };
});

// Ten seconds of TLA-ts checking mazes, on a 1920 by 1080 stage that fits the window, to record.
// It opens on the example's board and draws back over a plain of other boards, each with its own
// heart and walls, some of which pass the check.
export const Explainer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scale = useSyncExternalStore(
    subscribeToResize,
    () => Math.min(innerWidth / STAGE.width, innerHeight / STAGE.height),
    () => 1,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // The clip is on the dark theme, whatever theme the page was left in.
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.add("dark");
    const scene = createMazeScene(canvas, LAYOUT_LIST[0].map);
    if (!scene) return;
    const names = LAYOUT_LIST.map((layout) => scene.addLayout(layout.map, layout.tried));
    // ?at=4000 holds the loop at one moment, for a still.
    const held = new URLSearchParams(location.search).get("at");
    const startedAt = performance.now();
    let frame = requestAnimationFrame(function paint(now) {
      // A frame's time can be a moment before the clock read that started the loop.
      const time = held === null ? Math.max(0, now - startedAt) % LOOP_MS : Number(held);
      const drawnBack = Math.max(0, time - HOLD_MS) / (LOOP_MS - HOLD_MS);
      const distance = CAMERA.distance * CAMERA.drawnBack ** drawnBack;
      const steps = Math.floor(time / STEP_MS);
      const glide = Math.min(1, (time % STEP_MS) / STEP_MS / GLIDE);
      const eased = glide * glide * (3 - 2 * glide);
      // The boards the camera can see: more of them ahead of it than behind, and to each side.
      const columns = Math.ceil((distance * 0.95) / PLAIN_PITCH) + 1;
      const boards: PlainBoard[] = [];
      for (
        let row = -Math.ceil((distance * 0.72) / PLAIN_PITCH) - 1;
        row <= Math.ceil((distance * 0.42) / PLAIN_PITCH) + 1;
        row++
      )
        for (let column = -columns; column <= columns; column++) {
          const isMiddle = column === 0 && row === 0;
          const mixed = Math.abs((column * 73_856_093) ^ (row * 19_349_663));
          const which = isMiddle ? 0 : 1 + (mixed % (LAYOUTS - 1));
          const layout = LAYOUT_LIST[which];
          const tried = layout.tried;
          const last = tried.length - 1;
          const step = (steps + (isMiddle ? 0 : mixed % 997)) % (tried.length + REST_STEPS);
          const isResting = step > last;
          const index = Math.min(step, last);
          const moved = isResting ? 1 : eased;
          const to = tried[index].square;
          const from = tried[index].parent === -1 ? to : tried[tried[index].parent].square;
          const isNear = distance < NEAR_DISTANCE || Math.max(Math.abs(column), Math.abs(row)) <= 1;
          boards.push({
            layout: names[which],
            column,
            row,
            player: { x: from.x + (to.x - from.x) * moved, y: from.y + (to.y - from.y) * moved },
            hop: Math.sin(Math.PI * moved) * 0.22,
            yaw: Math.atan2(to.x - from.x, to.y - from.y),
            reached: index + 1,
            way: isNear && index > 0 ? index : undefined,
            end: isResting ? (layout.hasBug ? "bug" : "pass") : "none",
            isHeartTaken: layout.hasBug && index === last && moved >= 1,
            isNear,
          });
        }
      scene.drawPlain(
        {
          eye: vec(0.5, CAMERA.lean.y * distance, 0.9 + CAMERA.lean.z * distance),
          target: vec(0.5, 0, 0.9),
          reach: distance * CAMERA.halfAngle,
          fog: [distance * 1.3, distance * 3.2],
        },
        boards,
        now,
      );
      canvas.dataset.ready = "";
      frame = requestAnimationFrame(paint);
    });
    return () => {
      cancelAnimationFrame(frame);
      root.classList.toggle("dark", wasDark);
    };
  }, []);

  return (
    <main className="dark fixed inset-0 flex cursor-none items-center justify-center overflow-hidden bg-card">
      <div
        style={{ width: STAGE.width, height: STAGE.height, zoom: scale }}
        className="relative shrink-0 overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="A plain of mazes, each with a robot making the moves TLA-ts tries."
          className="absolute inset-0 size-full"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-linear-to-t from-card via-card/80 to-transparent px-16 pt-40 pb-12 font-pixel text-foreground">
          <p className="font-sans text-7xl font-medium tracking-tight">
            Find bugs in TypeScript code
          </p>
          <p className="text-5xl">TLA-ts</p>
        </div>
      </div>
    </main>
  );
};
