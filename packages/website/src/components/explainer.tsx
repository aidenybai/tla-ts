import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Fog,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  UniformsLib,
  UniformsUtils,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from "three";
import { MAZE_MAP, type Square } from "./maze-scene";

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
const LAYOUTS = 48;
// The boards stand in a grid, more of them ahead of the camera than behind it.
const COLUMNS = 35;
const ROWS_AHEAD = 24;
const ROWS_BEHIND = 13;
// From the middle of one board to the middle of the next.
const PITCH = 8.4;
// The boards this near the middle one draw the way to the square they are on.
const WAY_REACH = 4;
const CAMERA = { fieldOfView: 38, distance: 13, drawnBack: 12, lean: [0, 0.766, 0.643] };
const TONES = {
  ground: "#191918",
  slab: "#222221",
  wall: "#2c2c2a",
  line: "#4da1ff",
  heart: "#ff5a7e",
  bug: "#f0364a",
  pass: "#3dd68c",
};

type Triple = [number, number, number];

// A square or a line of a board, and the step of its check that shows it.
interface Shown {
  at: Triple;
  size: Triple;
  data: number[];
}

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

interface Tried {
  square: Square;
  // The state whose move reached this one, or -1 for the first.
  parent: number;
}

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
    walls: squares.filter((square) => square.kind === "#"),
    heart: squares.find((square) => square.kind === "o") ?? START,
    ...getCheck(map),
  };
});

const paint = (size: number, draw: (pen: CanvasRenderingContext2D) => void) => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const pen = canvas.getContext("2d");
  if (pen) draw(pen);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

const SHOWN_VERTEX = `
uniform float uSteps;
uniform float uIsExact;
attribute float aOrder;
attribute float aPhase;
attribute float aLast;
attribute float aEnd;
varying float vEnd;
#include <fog_pars_vertex>
void main() {
  float step = mod(uSteps + aPhase, aLast + 1.0 + ${REST_STEPS}.0);
  float at = min(step, aLast);
  bool isShown = uIsExact > 0.5 ? abs(at - aOrder) < 0.5 : aOrder < at + 0.5;
  // 1 is the square of a bug. 2 is a board that passes, and 3 one with a bug, once its check ends.
  bool isResting = step > aLast;
  vEnd = aEnd > 2.5 ? (isResting ? 1.0 : 0.0) : aEnd > 1.5 ? (isResting ? 2.0 : 0.0) : aEnd;
  vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  gl_Position = isShown ? projectionMatrix * mvPosition : vec4(2.0, 2.0, 2.0, 1.0);
  #include <fog_vertex>
}`;

const SHOWN_FRAGMENT = `
uniform vec3 uTone;
uniform vec3 uBug;
uniform vec3 uPass;
uniform float uAlpha;
varying float vEnd;
#include <fog_pars_fragment>
void main() {
  vec3 tone = vEnd > 1.5 ? uPass : vEnd > 0.5 ? uBug : uTone;
  gl_FragColor = vec4(tone, vEnd > 0.5 ? min(1.0, uAlpha * 2.2) : uAlpha);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

// Ten seconds of TLA-ts checking mazes, on a 1920 by 1080 stage that fits the window, to record.
// It opens on the example's board and draws back over a plain of other boards, each with its own
// heart and walls, some of which pass the check.
export const Explainer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const scale = useSyncExternalStore(
    subscribeToResize,
    () => Math.min(innerWidth / STAGE.width, innerHeight / STAGE.height),
    () => 1,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(STAGE.width, STAGE.height, false);
    const scene = new Scene();
    scene.background = new Color(TONES.ground);
    const fog = new Fog(TONES.ground, 1, 2);
    scene.fog = fog;
    scene.add(new AmbientLight("#ffffff", 1.6));
    const sun = new DirectionalLight("#ffffff", 1.6);
    sun.position.set(-0.35, 1, 0.55);
    scene.add(sun);
    const camera = new PerspectiveCamera(CAMERA.fieldOfView, STAGE.width / STAGE.height, 1, 3000);

    const boards = Array.from(
      { length: COLUMNS * (ROWS_AHEAD + ROWS_BEHIND + 1) },
      (_value, index) => {
        const column = (index % COLUMNS) - (COLUMNS - 1) / 2;
        const row = Math.floor(index / COLUMNS) - ROWS_AHEAD;
        const isMiddle = column === 0 && row === 0;
        const mixed = Math.abs((column * 73_856_093) ^ (row * 19_349_663));
        return {
          column,
          row,
          x: column * PITCH,
          z: row * PITCH,
          layout: LAYOUT_LIST[isMiddle ? 0 : 1 + (mixed % (LAYOUTS - 1))],
          phase: isMiddle ? 0 : mixed % 997,
        };
      },
    );
    const getX = (board: (typeof boards)[number], square: Square) => board.x + square.x - 3;
    const getZ = (board: (typeof boards)[number], square: Square) => board.z + square.y - 3;

    const matrix = new Matrix4();
    const place = (mesh: InstancedMesh, index: number, at: Triple, size: Triple = [1, 1, 1]) =>
      mesh.setMatrixAt(index, matrix.makeScale(...size).setPosition(...at));
    const stand = (geometry: BufferGeometry, material: Material | Material[], count: number) => {
      const mesh = new InstancedMesh(geometry, material, count);
      mesh.frustumCulled = false;
      scene.add(mesh);
      return mesh;
    };

    const slabTop = paint(512, (pen) => {
      pen.fillStyle = TONES.slab;
      pen.fillRect(0, 0, 512, 512);
      pen.strokeStyle = "rgb(255 255 255 / 0.06)";
      pen.lineWidth = 2;
      for (let line = 1; line < SIZE; line++) {
        pen.strokeRect((line * 512) / SIZE, -4, 0, 520);
        pen.strokeRect(-4, (line * 512) / SIZE, 520, 0);
      }
      pen.strokeStyle = TONES.line;
      pen.lineWidth = 6;
      pen.strokeRect(3, 3, 506, 506);
    });
    const wallFace = paint(128, (pen) => {
      pen.fillStyle = TONES.wall;
      pen.fillRect(0, 0, 128, 128);
      pen.strokeStyle = TONES.line;
      pen.lineWidth = 6;
      pen.strokeRect(3, 3, 122, 122);
    });
    const slabSide = new MeshLambertMaterial({ color: TONES.slab });
    const slabs = stand(
      new BoxGeometry(SIZE, 0.5, SIZE),
      [slabSide, slabSide, new MeshLambertMaterial({ map: slabTop }), slabSide, slabSide, slabSide],
      boards.length,
    );
    boards.forEach((board, index) => place(slabs, index, [board.x, -0.25, board.z]));

    const wallSquares = boards.flatMap((board) =>
      board.layout.walls.map((wall) => ({ board, wall })),
    );
    const walls = stand(
      new BoxGeometry(1, 0.7, 1),
      new MeshLambertMaterial({ map: wallFace }),
      wallSquares.length,
    );
    wallSquares.forEach((item, index) =>
      place(walls, index, [getX(item.board, item.wall), 0.35, getZ(item.board, item.wall)]),
    );

    const outline = new Shape();
    outline.moveTo(0, -0.32);
    outline.bezierCurveTo(-0.5, 0, -0.42, 0.42, -0.2, 0.42);
    outline.bezierCurveTo(-0.08, 0.42, 0, 0.32, 0, 0.24);
    outline.bezierCurveTo(0, 0.32, 0.08, 0.42, 0.2, 0.42);
    outline.bezierCurveTo(0.42, 0.42, 0.5, 0, 0, -0.32);
    const hearts = stand(
      new ExtrudeGeometry(outline, { depth: 0.16, bevelEnabled: false }).rotateX(-0.6),
      new MeshBasicMaterial({ color: TONES.heart }),
      boards.length,
    );

    const robots = stand(
      new SphereGeometry(0.4, 14, 9),
      new MeshBasicMaterial({ color: TONES.line, wireframe: true }),
      boards.length,
    );
    const cores = stand(
      new SphereGeometry(0.385, 14, 9),
      new MeshBasicMaterial({ color: TONES.ground }),
      boards.length,
    );

    // A square or a line on a board, shown by the step that board's check is on.
    const show = (items: Shown[], isExact: boolean, alpha: number) => {
      const geometry = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
      for (const [name, column] of [
        ["aOrder", 0],
        ["aPhase", 1],
        ["aLast", 2],
        ["aEnd", 3],
      ] as const)
        geometry.setAttribute(
          name,
          new InstancedBufferAttribute(new Float32Array(items.map((item) => item.data[column])), 1),
        );
      const material = new ShaderMaterial({
        uniforms: UniformsUtils.merge([
          UniformsLib.fog,
          {
            uSteps: { value: 0 },
            uIsExact: { value: isExact ? 1 : 0 },
            uTone: { value: new Color(TONES.line) },
            uBug: { value: new Color(TONES.bug) },
            uPass: { value: new Color(TONES.pass) },
            uAlpha: { value: alpha },
          },
        ]),
        vertexShader: SHOWN_VERTEX,
        fragmentShader: SHOWN_FRAGMENT,
        fog: true,
        transparent: true,
        depthWrite: false,
      });
      const mesh = stand(geometry, material, items.length);
      items.forEach((item, index) => place(mesh, index, item.at, item.size));
      return material;
    };
    const washed = show(
      boards.flatMap((board) =>
        board.layout.tried.map((state, order): Shown => {
          const last = board.layout.tried.length - 1;
          return {
            at: [getX(board, state.square), 0.012, getZ(board, state.square)],
            size: [1, 1, 1],
            data: [order, board.phase, last, board.layout.hasBug ? (order === last ? 1 : 3) : 2],
          };
        }),
      ),
      false,
      0.2,
    );
    const lined = show(
      boards
        .filter((board) => Math.max(Math.abs(board.column), Math.abs(board.row)) <= WAY_REACH)
        .flatMap((board) =>
          board.layout.tried.flatMap((_state, order) => {
            const tried = board.layout.tried;
            const last = tried.length - 1;
            const way: Shown[] = [];
            for (let index = order; tried[index].parent !== -1; index = tried[index].parent) {
              const to = tried[index].square;
              const from = tried[tried[index].parent].square;
              way.push({
                at: [board.x + (from.x + to.x) / 2 - 3, 0.02, board.z + (from.y + to.y) / 2 - 3],
                size: [Math.abs(to.x - from.x) + 0.09, 1, Math.abs(to.y - from.y) + 0.09],
                data: [order, board.phase, last, board.layout.hasBug && order === last ? 1 : 0],
              });
            }
            return way;
          }),
        ),
      true,
      1,
    );

    // ?at=4000 holds the loop at one moment, for a still.
    const held = new URLSearchParams(location.search).get("at");
    const startedAt = performance.now();
    let lastTime = 0;
    let checked = 0;
    let frame = requestAnimationFrame(function draw(now) {
      // A frame's time can be a moment before the clock read that started the loop.
      const time = held === null ? Math.max(0, now - startedAt) % LOOP_MS : Number(held);
      if (time < lastTime) checked = 0;
      const drawnBack = Math.max(0, time - HOLD_MS) / (LOOP_MS - HOLD_MS);
      const distance = CAMERA.distance * CAMERA.drawnBack ** drawnBack;
      camera.position.set(
        CAMERA.lean[0] * distance,
        CAMERA.lean[1] * distance,
        CAMERA.lean[2] * distance + 0.4,
      );
      camera.lookAt(0, 0, 0.4);
      fog.near = distance * 1.05;
      fog.far = distance * 2.7;

      const steps = Math.floor(time / STEP_MS);
      const glide = Math.min(1, (time % STEP_MS) / STEP_MS / GLIDE);
      const eased = glide * glide * (3 - 2 * glide);
      boards.forEach((board, index) => {
        const tried = board.layout.tried;
        const step = (steps + board.phase) % (tried.length + REST_STEPS);
        const isResting = step >= tried.length;
        const state = tried[Math.min(step, tried.length - 1)];
        const to = state.square;
        const from = state.parent === -1 ? to : tried[state.parent].square;
        const moved = isResting ? 1 : eased;
        const hop = Math.sin(Math.PI * moved) * 0.22;
        const at: Triple = [
          board.x + from.x + (to.x - from.x) * moved - 3,
          0.5 + hop,
          board.z + from.y + (to.y - from.y) * moved - 3,
        ];
        place(robots, index, at, [1, 0.9, 1]);
        place(cores, index, at, [1, 0.9, 1]);
        const isTaken =
          board.layout.hasBug &&
          Math.min(step, tried.length - 1) === tried.length - 1 &&
          moved >= 1;
        const heart = isTaken ? 0 : 1;
        place(
          hearts,
          index,
          [getX(board, board.layout.heart), 0.62, getZ(board, board.layout.heart)],
          [heart, heart, heart],
        );
      });
      for (const mesh of [robots, cores, hearts]) mesh.instanceMatrix.needsUpdate = true;
      washed.uniforms.uSteps.value = steps;
      lined.uniforms.uSteps.value = steps;
      renderer.render(scene, camera);

      // Every board in sight checks a state each step.
      checked +=
        (Math.min(boards.length, (distance / CAMERA.distance) ** 2) *
          Math.max(0, time - lastTime)) /
        STEP_MS;
      lastTime = time;
      if (countRef.current) countRef.current.textContent = Math.round(checked).toLocaleString();
      canvas.dataset.ready = "";
      frame = requestAnimationFrame(draw);
    });
    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
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
