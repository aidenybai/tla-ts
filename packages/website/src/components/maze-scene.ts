// The maze as the sandbox draws it: a white board over a wire grid, outlined walls, a pink
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
  unit,
  vec,
  within,
  type Shape,
  type Vec3,
} from "@/lib/sandbox-figure";
import { createRenderer, getCameraAxes, isDark, KIND } from "@/lib/sandbox-render";

export interface Square {
  x: number;
  y: number;
}

export interface MazeView {
  player: Square;
  // The way the player last went, as a turn about the up axis.
  yaw: number;
  // The squares the reader has stood on, in order.
  trail: Square[];
  // The squares a search reached, in order, and when it began to show them.
  reached: (Square & { isFailing: boolean })[];
  floodAt: number;
  // The way the search found to the heart, once all of it has shown.
  route: Square[] | undefined;
  isHeartTaken: boolean;
  // Whether the reader asked for less motion, so that nothing bobs, turns or glides.
  isStill: boolean;
}

const EYE = vec(0.5, 10, 7.9);
const TARGET = vec(0.5, 0, 0.6);
const FOV = 0.62;
const WALL_HEIGHT = 0.7;
const BOT = { size: 0.4, lift: 0.5 };
const BOT_VISOR = [0.05, 0.62, 0.36, 0.22];
const MOVE_MS = 190;
export const FLOOD_MS = 70;
const BLUE = [0.0103, 0.513, 0.9595];
const RED = [0.92, 0.12, 0.2];

// Blues to go with the blue lines, barely off white, and slate blues in the dark.
const LIGHT = {
  track: rgb("#FAFCFF"),
  block: rgb("#F5F9FF"),
  floor: rgb("#FFFFFF"),
  heart: rgb("#FF5A7E"),
  heartShadow: rgb("#C2224F"),
  wireFill: rgb("#F5F9FF"),
};
const DARK = {
  track: rgb("#1B2029"),
  block: rgb("#1F2631"),
  floor: rgb("#18181A"),
  heart: rgb("#FF5A7E"),
  heartShadow: rgb("#FF2D62"),
  wireFill: rgb("#16202E"),
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

  const draw = (view: MazeView, now: number) => {
    const colours = isDark() ? DARK : LIGHT;
    const seconds = view.isStill ? 0 : now / 1000;
    aspect = renderer.begin(EYE, TARGET, FOV);
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
      step = { from: step.to, to: target, startedAt: now, isFirst: false };
    const progress = smooth(0, 1, clamp((now - step.startedAt) / MOVE_MS, 0, 1));
    const distance = Math.hypot(step.to.x - step.from.x, step.to.z - step.from.z);
    // A step is a small hop, and a dash a leap high enough to clear a wall.
    const hop = Math.sin(Math.PI * progress) * (distance > 1.5 ? 0.95 : 0.22);
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
    renderer.drawWire(meshes.botHead, bot, {
      tone: colours.wireFill,
      kind: KIND.visor,
      cheer: view.isHeartTaken && hasArrived ? 1 : 0,
      visor: BOT_VISOR,
    });
    renderer.drawWire(meshes.botCap, within(bot, place(vec(0, 0.92, -0.04))), {
      tone: colours.wireFill,
    });
    for (const side of [-1, 1])
      renderer.drawWire(meshes.botEar, within(bot, place(vec(side * 1.03, -0.06, -0.04))), {
        tone: colours.wireFill,
      });

    // The way the search found, as red studs. They ride over a wall where the way crosses one.
    if (view.route)
      view.route.slice(1).forEach((square, index) => {
        const from = view.route?.[index] ?? square;
        for (const share of [0.25, 0.5, 0.75, 1]) {
          const stud = {
            x: blend(from.x, square.x, share),
            y: blend(from.y, square.y, share),
          };
          const lift = isWall({ x: Math.round(stud.x), y: Math.round(stud.y) }) ? WALL_HEIGHT : 0;
          renderer.draw(
            meshes.disc,
            place(add(getGround(stud), vec(0, lift + 0.03, 0)), 0, vec(0.11, 30, 0.11)),
            { tone: RED },
          );
        }
      });

    renderer.drawBlended(() => {
      view.reached.forEach((square, order) => {
        const shown = view.isStill ? 1 : clamp((now - view.floodAt - order * FLOOD_MS) / 160, 0, 1);
        if (shown === 0) return;
        renderer.draw(
          meshes.cube,
          place(
            add(getGround(square), vec(0, 0.012, 0)),
            0,
            vec(0.44 * shown, 0.004, 0.44 * shown),
          ),
          {
            tone: square.isFailing ? RED : BLUE,
            alpha: square.isFailing ? 0.55 : 0.22,
            isFlat: true,
          },
        );
      });
      for (const square of view.trail.slice(0, -1))
        renderer.draw(
          meshes.disc,
          place(add(getGround(square), vec(0, 0.014, 0)), 0, vec(0.12, 1, 0.12)),
          { tone: BLUE, alpha: 0.55, isFlat: true },
        );
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

  // The square under a point of the canvas, given across and down it from 0 to 1.
  const pick = (across: number, down: number): Square => {
    const axes = getCameraAxes(EYE, TARGET);
    const reach = Math.tan(FOV / 2);
    const ray = unit(
      add(
        add(
          scaled(axes.right, (across * 2 - 1) * reach * aspect),
          scaled(axes.up, (1 - down * 2) * reach),
        ),
        scaled(axes.back, -1),
      ),
    );
    const hit = add(EYE, scaled(ray, -EYE.y / ray.y));
    return { x: Math.floor(hit.x + 3), y: Math.floor(hit.z + 3) };
  };

  return { draw, pick };
};
