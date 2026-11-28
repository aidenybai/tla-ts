// The maze as the sandbox draws it: a pale board over a wire grid, outlined walls, a pink
// heart, and the player as a wireframe robot. The robot and the heart are the Crucible app's.

import {
  add,
  ball,
  blend,
  clamp,
  place,
  pressed,
  rgb,
  scaled,
  smooth,
  surface,
  vec,
  within,
  type Frame,
  type Shape,
  type Vec3,
} from "@/lib/sandbox-figure";
import { createRenderer, getCameraAxes, isDark, KIND } from "@/lib/sandbox-render";
import type { SearchState } from "@/lib/search";

// The board of the example's code: # is a wall and o is the heart.
export const MAZE_MAP = [
  ".......",
  ".......",
  "..#.#..",
  "..#o#..",
  "..###..",
  ".......",
  ".......",
];
export const MAZE_HEART = { x: 3, y: 3 };

export interface Square {
  x: number;
  y: number;
}

export const getStateSquare = (state: SearchState | undefined): Square => {
  const values = new Map(state?.variables.map((variable) => [variable.name, variable.value]));
  return { x: Number(values.get("x")), y: Number(values.get("y")) };
};

export interface MazeView {
  player: Square;
  // The way the player last went, as a turn about the up axis.
  yaw: number;
  // The squares the reader has stood on, in order.
  trail: Square[];
  // Where the move that brought the player here began, where it was not the last square.
  cameFrom: Square | undefined;
  // The squares a search has reached so far, in order.
  reached: (Square & { isFailing: boolean })[];
  // The way the search took to the square it is on.
  route: Square[] | undefined;
  isHeartTaken: boolean;
  // Whether the reader asked for less motion, so that nothing bobs, turns or glides.
  isStill: boolean;
}

// The camera looks down from in front with no perspective, so the board stays a straight grid.
const EYE = vec(0.5, 12, 6.4);
const TARGET = vec(0.5, 0, 0.62);
// Half the height of what the camera shows.
const REACH = 3.4;
// A camera with a vanishing point: `reach` is half the height it shows where it looks, and `fog`
// is how far from it things start to fade and where they are gone.
export interface PlainCamera {
  eye: Vec3;
  target: Vec3;
  reach: number;
  fog: number[];
}

// A state of a board's check: the square it is on, and the state whose move reached it, or -1.
export interface Tried {
  square: Square;
  parent: number;
}

// One board of a plain of boards, at a moment of its check.
export interface PlainBoard {
  // The board, as `addLayout` named it.
  layout: number;
  // How many boards across and back from the middle one it stands.
  column: number;
  row: number;
  // Where the robot is, which is between two squares in the middle of a move.
  player: Square;
  hop: number;
  yaw: number;
  // How many states of the check show as reached.
  reached: number;
  // The state whose way shows, on a board near enough to see it.
  way: number | undefined;
  end: "none" | "pass" | "bug";
  isHeartTaken: boolean;
  // Whether the board is near enough to draw the robot's ears and cap.
  isNear: boolean;
}

// From the middle of one board of a plain to the middle of the next.
export const PLAIN_PITCH = 9;
const GREEN = [0.24, 0.84, 0.55];
const WALL_HEIGHT = 0.7;
const BOT = { size: 0.4, lift: 0.5 };
const BOT_VISOR = [0.05, 0.62, 0.36, 0.22];
const MOVE_MS = 190;
const RED = [0.92, 0.12, 0.2];

// The page's own warm whites, under the sandbox's blue lines.
const LIGHT = {
  track: rgb("#FDFDFC"),
  block: rgb("#F6F5F3"),
  floor: rgb("#FFFFFF"),
  heart: rgb("#FF5A7E"),
  heartShadow: rgb("#C2224F"),
  wireFill: rgb("#FDFDFC"),
  trail: rgb("#0383F5"),
  way: rgb("#0383F5"),
};
const DARK = {
  track: rgb("#222221"),
  block: rgb("#2A2A28"),
  floor: rgb("#191918"),
  heart: rgb("#FF5A7E"),
  heartShadow: rgb("#FF2D62"),
  wireFill: rgb("#191918"),
  trail: rgb("#4DA1FF"),
  way: rgb("#4DA1FF"),
};

// A box from -1 to 1 on each axis, each face flat, so the shader can find its edges.
const getCube = (): Shape => {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const faces = [
    [vec(1, 0, 0), vec(0, 1, 0), vec(0, 0, 1)],
    [vec(-1, 0, 0), vec(0, 0, 1), vec(0, 1, 0)],
    [vec(0, 1, 0), vec(0, 0, 1), vec(1, 0, 0)],
    [vec(0, -1, 0), vec(1, 0, 0), vec(0, 0, 1)],
    [vec(0, 0, 1), vec(1, 0, 0), vec(0, 1, 0)],
    [vec(0, 0, -1), vec(0, 1, 0), vec(1, 0, 0)],
  ];
  for (const [normal, across, upward] of faces) {
    const base = positions.length / 3;
    for (const [first, second] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      positions.push(
        normal.x + first * across.x + second * upward.x,
        normal.y + first * across.y + second * upward.y,
        normal.z + first * across.z + second * upward.z,
      );
      normals.push(normal.x, normal.y, normal.z);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return { positions, normals, indices };
};

// A heart, standing up: two round lobes with straight sides down to a point, puffed out front
// and back like a pillow.
const LOBE = 0.5;
const TIP = -1.25;

const isInsideHeart = (x: number, y: number) => {
  if (Math.hypot(x - LOBE, y) <= LOBE || Math.hypot(x + LOBE, y) <= LOBE) return true;
  if (y > 0 || y < TIP) return false;
  const reach = Math.hypot(LOBE, -TIP);
  const tangent = Math.sqrt(reach * reach - LOBE * LOBE);
  const angle = Math.atan2(-TIP, LOBE) - Math.asin(LOBE / reach);
  const sideX = tangent * Math.cos(angle);
  const sideY = TIP + tangent * Math.sin(angle);
  const width =
    y < sideY
      ? (sideX * (y - TIP)) / (sideY - TIP)
      : sideX + ((LOBE - sideX) * (y - sideY)) / -sideY;
  return Math.abs(x) <= width;
};

// Where a ray from the heart's middle leaves it.
const getHeartEdge = (turn: number) => {
  const middle = -0.4;
  const angle = turn * Math.PI * 2;
  let low = 0;
  let high = 2;
  for (let pass = 0; pass < 24; pass += 1) {
    const radius = (low + high) / 2;
    if (isInsideHeart(Math.sin(angle) * radius, middle + Math.cos(angle) * radius)) low = radius;
    else high = radius;
  }
  return vec(Math.sin(angle) * low, middle + Math.cos(angle) * low, 0);
};

const getHeart = (): Shape => {
  const size = 0.36;
  const centre = (0.5 + TIP) / 2;
  const samples = 384;
  const edges = Array.from({ length: samples }, (_edge, index) => getHeartEdge(index / samples));
  return surface(96, 16, (turn, travel) => {
    const at = (((turn % 1) + 1) % 1) * samples;
    const index = Math.floor(at);
    const from = edges[index % samples];
    const to = edges[(index + 1) % samples];
    const swell = Math.sin(Math.PI * travel) ** 0.5;
    return vec(
      blend(from.x, to.x, at - index) * size * swell,
      (blend(from.y, to.y, at - index) - centre) * size * swell,
      -Math.cos(Math.PI * travel) * 0.15,
    );
  });
};

// The robot's head: rounder above, flatter below, a little boxy.
const dome = (sphere: Vec3) => {
  const across = blend(0.5, 0.86, smooth(-0.5, 0.75, sphere.y));
  const up = sphere.y < 0 ? 0.5 : 0.72;
  return vec(
    Math.sign(sphere.x) * Math.abs(sphere.x) ** across,
    Math.sign(sphere.y) * Math.abs(sphere.y) ** up,
    Math.sign(sphere.z) * Math.abs(sphere.z) ** across,
  );
};

// Flat patches of ground as one shape, each from one corner [x, z] to the other [x, z].
const getPatches = (patches: number[][]): Shape => ({
  positions: patches.flatMap(([left, back, right, front]) => [
    left,
    0,
    back,
    left,
    0,
    front,
    right,
    0,
    front,
    right,
    0,
    back,
  ]),
  normals: patches.flatMap(() => [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]),
  indices: patches.flatMap((_patch, index) =>
    [0, 1, 2, 0, 2, 3].map((corner) => index * 4 + corner),
  ),
});

// The middle of a square, on the board's top.
const getGround = (square: Square) => vec(square.x - 2.5, 0, square.y - 2.5);

// Returns nothing where the browser cannot draw the scene.
export const createMazeScene = (canvas: HTMLCanvasElement, map: string[]) => {
  const renderer = createRenderer(canvas);
  if (!renderer) return undefined;
  const meshes = {
    cube: renderer.store(getCube()),
    disc: renderer.store(ball(32, vec(1, 0.001, 1))),
    heart: renderer.store(getHeart()),
    botHead: renderer.storeWire(ball(24, vec(1, 0.9, 0.9), dome), 24),
    botEar: renderer.storeWire(ball(10, vec(0.11, 0.27, 0.27), pressed("x")), 10),
    botCap: renderer.storeWire(ball(12, vec(0.19, 0.07, 0.19), pressed("y")), 12),
  };
  const squares = map.flatMap((row, y) => [...row].map((kind, x) => ({ x, y, kind })));
  const walls = squares.filter((square) => square.kind === "#");
  const heart = squares.find((square) => square.kind === "o") ?? { x: 0, y: 0 };
  const isWall = (square: Square) => map[square.y]?.[square.x] === "#";
  // The step the robot is making: where from, where to, and when it set off.
  let step = { from: vec(0, 0, 0), to: vec(0, 0, 0), startedAt: 0, isFirst: true };
  let aspect = 1;

  const drawBot = (bot: Frame, fill: number[], isCheering: boolean, isWhole: boolean) => {
    renderer.drawWire(meshes.botHead, bot, {
      tone: fill,
      kind: KIND.visor,
      cheer: isCheering ? 1 : 0,
      visor: BOT_VISOR,
    });
    if (!isWhole) return;
    renderer.drawWire(meshes.botCap, within(bot, place(vec(0, 0.92, -0.04))), { tone: fill });
    for (const side of [-1, 1])
      renderer.drawWire(meshes.botEar, within(bot, place(vec(side * 1.03, -0.06, -0.04))), {
        tone: fill,
      });
  };

  const draw = (view: MazeView, now: number) => {
    const colours = isDark() ? DARK : LIGHT;
    const seconds = view.isStill ? 0 : now / 1000;
    aspect = renderer.begin(EYE, TARGET, REACH);
    const drawBox = (centre: Vec3, half: Vec3, tone: number[], kind: number) =>
      renderer.draw(meshes.cube, place(centre, 0, half), { tone, kind });
    // The void's floor, a wire grid far below the board.
    drawBox(vec(0.5, -5, 0.5), vec(120, 0.01, 120), colours.floor, KIND.floor);
    drawBox(vec(0.5, -0.25, 0.5), vec(3.5, 0.25, 3.5), colours.track, KIND.track);
    for (const wall of walls)
      drawBox(
        add(getGround(wall), vec(0, WALL_HEIGHT / 2, 0)),
        vec(0.5, WALL_HEIGHT / 2, 0.5),
        colours.block,
        KIND.box,
      );

    const target = getGround(view.player);
    if (step.isFirst || view.isStill)
      step = { from: target, to: target, startedAt: 0, isFirst: false };
    if (target.x !== step.to.x || target.z !== step.to.z)
      step = {
        from: view.cameFrom ? getGround(view.cameFrom) : step.to,
        to: target,
        startedAt: now,
        isFirst: false,
      };
    const progress = smooth(0, 1, clamp((now - step.startedAt) / MOVE_MS, 0, 1));
    const hop = Math.sin(Math.PI * progress) * 0.22;
    const at = vec(
      blend(step.from.x, step.to.x, progress),
      0,
      blend(step.from.z, step.to.z, progress),
    );
    const hasArrived = progress >= 1;

    if (!(view.isHeartTaken && hasArrived))
      renderer.draw(
        meshes.heart,
        place(
          add(getGround(heart), vec(0, 0.62 + 0.07 * Math.sin(seconds * 2.4), 0)),
          seconds * 1.6,
        ),
        { tone: colours.heart, kind: KIND.heart },
      );

    const bot = place(
      add(at, vec(0, BOT.lift + hop + 0.03 * Math.sin(seconds * 3), 0)),
      view.yaw,
      vec(BOT.size, BOT.size, BOT.size),
    );
    drawBot(bot, colours.wireFill, view.isHeartTaken && hasArrived, true);

    renderer.drawBlended(() => {
      // A square the search stood on is a shade darker, with no edge of its own.
      for (const square of view.reached)
        renderer.draw(
          meshes.cube,
          place(add(getGround(square), vec(0, 0.012, 0)), 0, vec(0.5, 0.004, 0.5)),
          {
            tone: square.isFailing ? RED : colours.trail,
            alpha: square.isFailing ? 0.22 : 0.09,
            isFlat: true,
          },
        );
      // A way across the board is one thin line: the reader's in blue, the search's in red.
      const drawWay = (way: Square[], tone: number[], alpha: number) =>
        way.slice(1).forEach((square, index) => {
          const from = getGround(way[index]);
          const to = getGround(square);
          renderer.draw(
            meshes.cube,
            place(
              vec((from.x + to.x) / 2, 0.016, (from.z + to.z) / 2),
              0,
              vec(Math.abs(to.x - from.x) / 2 + 0.03, 0.004, Math.abs(to.z - from.z) / 2 + 0.03),
            ),
            { tone, alpha, isFlat: true },
          );
        });
      drawWay(view.trail, colours.way, 1);
      if (view.route) drawWay(view.route, view.isHeartTaken ? RED : colours.way, 1);
      const isOverWall = isWall({ x: Math.round(at.x + 2.5), y: Math.round(at.z + 2.5) });
      renderer.draw(
        meshes.disc,
        place(add(at, vec(0, isOverWall ? WALL_HEIGHT + 0.01 : 0.016, 0)), 0, vec(0.36, 1, 0.36)),
        { tone: [0, 0, 0], kind: KIND.shadow, alpha: 1 - 0.4 * clamp(hop, 0, 1) },
      );
      if (!(view.isHeartTaken && hasArrived))
        renderer.draw(
          meshes.disc,
          place(add(getGround(heart), vec(0, 0.016, 0)), 0, vec(0.32, 1, 0.32)),
          { tone: colours.heartShadow, kind: KIND.shadow, alpha: 0.9 },
        );
    });
  };

  const layouts: {
    walls: Square[];
    heart: Square;
    washes: ReturnType<typeof renderer.store>[];
    ways: ReturnType<typeof renderer.store>[];
  }[] = [];

  // Takes a board and the states of its check, and returns the name `drawPlain` knows it by.
  const addLayout = (layoutMap: string[], tried: Tried[]) => {
    const layoutSquares = layoutMap.flatMap((row, y) =>
      [...row].map((kind, x) => ({ x, y, kind })),
    );
    layouts.push({
      walls: layoutSquares.filter((square) => square.kind === "#"),
      heart: layoutSquares.find((square) => square.kind === "o") ?? { x: 0, y: 0 },
      // The squares of the first states, as one shape for each count of them.
      washes: tried.map((_state, last) =>
        renderer.store(
          getPatches(
            tried
              .slice(0, last + 1)
              .map((state) => [
                state.square.x - 3,
                state.square.y - 3,
                state.square.x - 2,
                state.square.y - 2,
              ]),
          ),
        ),
      ),
      // The way to each state, as one shape.
      ways: tried.map((_state, last) => {
        const patches: number[][] = [];
        for (let index = last; tried[index].parent !== -1; index = tried[index].parent) {
          const to = getGround(tried[index].square);
          const from = getGround(tried[tried[index].parent].square);
          patches.push([
            Math.min(from.x, to.x) - 0.03,
            Math.min(from.z, to.z) - 0.03,
            Math.max(from.x, to.x) + 0.03,
            Math.max(from.z, to.z) + 0.03,
          ]);
        }
        return renderer.store(getPatches(patches));
      }),
    });
    return layouts.length - 1;
  };

  // Draws many boards under one camera, each as `draw` draws its own.
  const drawPlain = (camera: PlainCamera, boards: PlainBoard[], now: number) => {
    const colours = isDark() ? DARK : LIGHT;
    const seconds = now / 1000;
    renderer.begin(camera.eye, camera.target, camera.reach, true, camera.fog);
    for (const board of boards) {
      const layout = layouts[board.layout];
      const origin = vec(board.column * PLAIN_PITCH, 0, board.row * PLAIN_PITCH);
      renderer.draw(meshes.cube, place(add(origin, vec(0.5, -0.25, 0.5)), 0, vec(3.5, 0.25, 3.5)), {
        tone: colours.track,
        kind: KIND.track,
      });
      for (const wall of layout.walls)
        renderer.draw(
          meshes.cube,
          place(
            add(origin, add(getGround(wall), vec(0, WALL_HEIGHT / 2, 0))),
            0,
            vec(0.5, WALL_HEIGHT / 2, 0.5),
          ),
          { tone: colours.block, kind: KIND.box },
        );
      if (!board.isHeartTaken)
        renderer.draw(
          meshes.heart,
          place(
            add(
              origin,
              add(getGround(layout.heart), vec(0, 0.62 + 0.07 * Math.sin(seconds * 2.4), 0)),
            ),
            seconds * 1.6,
          ),
          { tone: colours.heart, kind: KIND.heart },
        );
      const at = add(origin, getGround(board.player));
      drawBot(
        place(
          add(at, vec(0, BOT.lift + board.hop, 0)),
          board.yaw,
          vec(BOT.size, BOT.size, BOT.size),
        ),
        colours.wireFill,
        board.isHeartTaken,
        board.isNear,
      );
      renderer.drawBlended(() => {
        renderer.draw(layout.washes[board.reached - 1], place(add(origin, vec(0, 0.012, 0))), {
          tone: board.end === "pass" ? GREEN : board.end === "bug" ? RED : colours.trail,
          alpha: board.end === "none" ? 0.12 : 0.24,
          isFlat: true,
        });
        if (board.way !== undefined)
          renderer.draw(layout.ways[board.way], place(add(origin, vec(0, 0.016, 0))), {
            tone: board.isHeartTaken ? RED : colours.way,
            isFlat: true,
          });
        const isOverWall = layout.walls.some(
          (wall) => wall.x === Math.round(board.player.x) && wall.y === Math.round(board.player.y),
        );
        renderer.draw(
          meshes.disc,
          place(add(at, vec(0, isOverWall ? WALL_HEIGHT + 0.01 : 0.016, 0)), 0, vec(0.36, 1, 0.36)),
          { tone: [0, 0, 0], kind: KIND.shadow, alpha: 1 - 0.4 * clamp(board.hop, 0, 1) },
        );
        if (!board.isHeartTaken)
          renderer.draw(
            meshes.disc,
            place(
              add(origin, add(getGround(layout.heart), vec(0, 0.016, 0))),
              0,
              vec(0.32, 1, 0.32),
            ),
            { tone: colours.heartShadow, kind: KIND.shadow, alpha: 0.9 },
          );
      });
    }
  };

  // The square under a point of the canvas, given across and down it from 0 to 1.
  const pick = (across: number, down: number): Square => {
    const axes = getCameraAxes(EYE, TARGET);
    const from = add(
      EYE,
      add(
        scaled(axes.right, (across * 2 - 1) * REACH * aspect),
        scaled(axes.up, (1 - down * 2) * REACH),
      ),
    );
    const hit = add(from, scaled(axes.back, from.y / axes.back.y));
    return { x: Math.floor(hit.x + 3), y: Math.floor(hit.z + 3) };
  };

  return { draw, pick, addLayout, drawPlain };
};
