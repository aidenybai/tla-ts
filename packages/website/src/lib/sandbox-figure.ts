// The vectors, frames and shapes of the sandbox renderer, from the Crucible app's figures.

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Frame {
  readonly right: Vec3;
  readonly up: Vec3;
  readonly forward: Vec3;
  readonly origin: Vec3;
}

export interface Shape {
  readonly positions: number[];
  readonly normals: number[];
  readonly indices: number[];
}

export const vec = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

export const add = (first: Vec3, second: Vec3) =>
  vec(first.x + second.x, first.y + second.y, first.z + second.z);

export const scaled = (vector: Vec3, factor: number) =>
  vec(vector.x * factor, vector.y * factor, vector.z * factor);

export const cross = (first: Vec3, second: Vec3) =>
  vec(
    first.y * second.z - first.z * second.y,
    first.z * second.x - first.x * second.z,
    first.x * second.y - first.y * second.x,
  );

const unit = (vector: Vec3) => scaled(vector, 1 / Math.hypot(vector.x, vector.y, vector.z));

export const blend = (from: number, to: number, share: number) => from + (to - from) * share;

export const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

export const smooth = (low: number, high: number, value: number) => {
  const share = clamp((value - low) / (high - low), 0, 1);
  return share * share * (3 - 2 * share);
};

// A frame at `origin`, turned about the up axis by `yaw` and stretched to `size`.
export const place = (origin: Vec3, yaw = 0, size = vec(1, 1, 1)): Frame => {
  const turn = (vector: Vec3) =>
    vec(
      vector.x * Math.cos(yaw) + vector.z * Math.sin(yaw),
      vector.y,
      -vector.x * Math.sin(yaw) + vector.z * Math.cos(yaw),
    );
  return {
    right: turn(vec(size.x, 0, 0)),
    up: turn(vec(0, size.y, 0)),
    forward: turn(vec(0, 0, size.z)),
    origin,
  };
};

export const within = (parent: Frame, child: Frame): Frame => {
  const carry = (vector: Vec3) =>
    add(
      add(scaled(parent.right, vector.x), scaled(parent.up, vector.y)),
      scaled(parent.forward, vector.z),
    );
  return {
    right: carry(child.right),
    up: carry(child.up),
    forward: carry(child.forward),
    origin: add(parent.origin, carry(child.origin)),
  };
};

// A closed tube of `around` columns and `along` rows, through the points `getPoint` gives.
export const surface = (
  around: number,
  along: number,
  getPoint: (turn: number, travel: number) => Vec3,
): Shape => {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= along; row += 1) {
    for (let column = 0; column < around; column += 1) {
      const turn = column / around;
      const here = getPoint(turn, row / along);
      const inner = clamp(row / along, 0.004, 0.996);
      const lengthwise = add(
        getPoint(turn, inner + 0.002),
        scaled(getPoint(turn, inner - 0.002), -1),
      );
      const crosswise = add(
        getPoint(turn + 0.002, inner),
        scaled(getPoint(turn - 0.002, inner), -1),
      );
      const normal = unit(cross(lengthwise, crosswise));
      positions.push(here.x, here.y, here.z);
      normals.push(normal.x, normal.y, normal.z);
      if (row < along) {
        const base = row * around;
        const next = (column + 1) % around;
        indices.push(
          base + column,
          base + around + column,
          base + next,
          base + next,
          base + around + column,
          base + around + next,
        );
      }
    }
  }
  return { positions, normals, indices };
};

export const ball = (
  around: number,
  radii: Vec3,
  warp: (sphere: Vec3) => Vec3 = (sphere) => sphere,
) =>
  surface(around, Math.round(around * 0.7), (turn, travel) => {
    const warped = warp(
      vec(
        Math.sin(Math.PI * travel) * Math.cos(2 * Math.PI * turn),
        -Math.cos(Math.PI * travel),
        Math.sin(Math.PI * travel) * Math.sin(2 * Math.PI * turn),
      ),
    );
    return vec(radii.x * warped.x, radii.y * warped.y, radii.z * warped.z);
  });

// Flattens a ball along one axis, as an ear or a cap is.
export const pressed = (flat: "x" | "y") => (sphere: Vec3) =>
  vec(
    flat === "x" ? Math.sign(sphere.x) * Math.abs(sphere.x) ** 0.3 : sphere.x,
    flat === "y" ? Math.sign(sphere.y) * Math.abs(sphere.y) ** 0.3 : sphere.y,
    sphere.z,
  );

export const rgb = (hex: string) =>
  [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
