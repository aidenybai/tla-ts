import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { compilations } from "virtual:compilations";
import { examples } from "virtual:site-data";
import type { Precompiled } from "@/lib/compilation";
import { getPath, getTriedStates } from "@/lib/search";
import { useRun } from "@/hooks/use-run";
import { createMazeScene, getStateSquare, MAZE_HEART, MAZE_MAP } from "./maze-scene";

const STAGE = { width: 1920, height: 1080 };
const LOOP_MS = 10_000;
// One board fills the stage for this long, and then the view draws back.
const HOLD_MS = 900;
const BOARD = { width: 1000, height: 950 };
// How many times smaller a board is at the end of the loop than at its start.
const SHRINK = 18;
const STEP_MS = 130;
// The steps a board rests on the bug it found before it starts over.
const REST_STEPS = 10;
// Each board is kept at these sizes, so a small one is not drawn from a large picture.
const SCALES = [1, 0.5, 0.25, 0.125, 0.0625];

const subscribeToResize = (onChange: () => void) => {
  addEventListener("resize", onChange);
  return () => removeEventListener("resize", onChange);
};

// Where in the check a board starts, so that no two boards near each other move together.
const getPhase = (column: number, row: number) =>
  column === 0 && row === 0 ? 0 : Math.abs((column * 73_856_093) ^ (row * 19_349_663)) % 1000;

// Ten seconds of TLA-ts checking the maze, on a 1920 by 1080 stage that fits the window, to
// record. It opens on one board and draws back to a wall of them, each at its own point in the
// check.
export const Explainer = () => {
  const example = examples[0];
  const runner = useRun(true);
  const [compiled, setCompiled] = useState<Precompiled>();
  const sceneCanvasRef = useRef<HTMLCanvasElement>(null);
  const wallRef = useRef<HTMLCanvasElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const scale = useSyncExternalStore(
    subscribeToResize,
    () => Math.min(innerWidth / STAGE.width, innerHeight / STAGE.height),
    () => 1,
  );
  useEffect(() => {
    void compilations[example.fileName]?.().then(setCompiled);
  }, [example]);
  useEffect(() => {
    if (compiled === undefined) return;
    runner.run({
      source: compiled.compilation.tla,
      config: compiled.compilation.config,
      modules: compiled.compilation.modules,
      isSearchShown: true,
      typescript: { source: example.typescript.code, fileName: example.fileName },
    });
    // The run starts once, when the compilation loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compiled]);
  const search = runner.result?.search;
  const states = useMemo(() => (search ? getTriedStates(search) : []), [search]);

  useEffect(() => {
    const sceneCanvas = sceneCanvasRef.current;
    const wall = wallRef.current;
    const pen = wall?.getContext("2d");
    if (!sceneCanvas || !wall || !pen || states.length === 0) return;
    // The clip is on the dark theme, whatever theme the page was left in.
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.add("dark");
    const scene = createMazeScene(sceneCanvas, MAZE_MAP, true);
    if (!scene) return;
    const statesById = new Map(states.map((state) => [state.id, state]));
    // Every state of the check as a picture of the board, at each size.
    const pictures = states.map((state, index) => {
      const square = getStateSquare(state);
      const parent = statesById.get(state.parentId ?? "");
      const cameFrom = parent && getStateSquare(parent);
      scene.draw(
        {
          player: square,
          cameFrom: undefined,
          yaw: cameFrom ? Math.atan2(square.x - cameFrom.x, square.y - cameFrom.y) : 0,
          trail: [],
          reached: states
            .slice(0, index + 1)
            .map((reached) => ({ ...getStateSquare(reached), isFailing: reached.isFailing })),
          route: getPath(statesById, state.id).map(getStateSquare),
          isHeartTaken: square.x === MAZE_HEART.x && square.y === MAZE_HEART.y,
          isStill: true,
        },
        1_000_000,
      );
      let source: HTMLCanvasElement = sceneCanvas;
      return SCALES.map((size) => {
        const picture = document.createElement("canvas");
        picture.width = Math.round(BOARD.width * size);
        picture.height = Math.round(BOARD.height * size);
        picture.getContext("2d")?.drawImage(source, 0, 0, picture.width, picture.height);
        source = picture;
        return picture;
      });
    });
    const ratio = Math.min(devicePixelRatio, 2);
    wall.width = STAGE.width * ratio;
    wall.height = STAGE.height * ratio;
    const ground = getComputedStyle(root).getPropertyValue("--card");
    // ?at=4000 holds the loop at one moment, for a still.
    const held = new URLSearchParams(location.search).get("at");
    const startedAt = performance.now();
    let lastTime = 0;
    let checked = 0;
    let frame = requestAnimationFrame(function paint(now) {
      // A frame's time can be a moment before the clock read that started the loop.
      const time = held === null ? Math.max(0, now - startedAt) % LOOP_MS : Number(held);
      if (time < lastTime) checked = 0;
      const drawnBack = Math.max(0, time - HOLD_MS) / (LOOP_MS - HOLD_MS);
      const width = BOARD.width / SHRINK ** drawnBack;
      const height = (width * BOARD.height) / BOARD.width;
      const level = Math.max(
        0,
        SCALES.findLastIndex((size) => BOARD.width * size >= width * ratio),
      );
      // The boards stand far apart at first, so the stage opens on one, and close up as it draws back.
      const pitch = 1 + 0.95 * (width / BOARD.width) ** 2;
      const columns = Math.ceil(STAGE.width / 2 / (width * pitch) + 0.5);
      const rows = Math.ceil(STAGE.height / 2 / (height * pitch) + 0.5);
      const steps = Math.floor(time / STEP_MS);
      pen.setTransform(ratio, 0, 0, ratio, 0, 0);
      pen.fillStyle = ground;
      pen.fillRect(0, 0, STAGE.width, STAGE.height);
      for (let row = -rows; row <= rows; row++)
        for (let column = -columns; column <= columns; column++) {
          const step = (steps + getPhase(column, row)) % (states.length + REST_STEPS);
          pen.drawImage(
            pictures[Math.min(step, states.length - 1)][level],
            STAGE.width / 2 + column * width * pitch - width / 2,
            STAGE.height / 2 + row * height * pitch - height / 2,
            width,
            height,
          );
        }
      // Every board on the stage checks a state each step.
      checked += ((2 * columns + 1) * (2 * rows + 1) * Math.max(0, time - lastTime)) / STEP_MS;
      lastTime = time;
      if (countRef.current) countRef.current.textContent = Math.round(checked).toLocaleString();
      wall.dataset.ready = "";
      frame = requestAnimationFrame(paint);
    });
    return () => {
      cancelAnimationFrame(frame);
      root.classList.toggle("dark", wasDark);
    };
  }, [states]);

  return (
    <main className="dark fixed inset-0 flex cursor-none items-center justify-center overflow-hidden bg-card">
      <div
        style={{ width: STAGE.width, height: STAGE.height, zoom: scale }}
        className="relative shrink-0 overflow-hidden"
      >
        <canvas
          ref={sceneCanvasRef}
          aria-hidden
          style={{ width: BOARD.width, height: BOARD.height }}
          className="pointer-events-none absolute top-0 left-0 opacity-0"
        />
        <canvas
          ref={wallRef}
          role="img"
          aria-label="A wall of mazes, each with a robot making the moves TLA-ts tries."
          className="absolute inset-0 size-full"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-linear-to-t from-card via-card/80 to-transparent px-16 pt-40 pb-12 font-pixel text-foreground">
          <p className="text-4xl text-muted-foreground">
            <span ref={countRef} className="mr-4 text-8xl text-foreground tabular-nums">
              0
            </span>
            states checked
          </p>
          <p className="text-5xl">TLA-ts</p>
        </div>
      </div>
    </main>
  );
};
