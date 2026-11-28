// A small WebGL2 renderer with one shader for a light sandbox look: a pale void, white boxes
// with crisp blue outlines, grids, fog and blob shadows. From the Crucible app's tutorial game.

import { cross, type Frame, type Shape, type Vec3 } from "./sandbox-figure";

export const KIND = {
  plain: 0,
  box: 1,
  track: 2,
  floor: 3,
  visor: 4,
  robotHead: 5,
  heart: 6,
  shadow: 7,
  wire: 9,
};

export const isDark = () => document.documentElement.classList.contains("dark");

// The void things fade into, and every line's colour, in the light and in the dark.
const THEMES = {
  light: { void: [1, 1, 1], line: [0.0103, 0.513, 0.9595] },
  dark: { void: [0.098, 0.098, 0.094], line: [0.3, 0.631, 1.0] },
};

const VERTEX = `#version 300 es
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
uniform mat4 uViewProjection;
uniform mat4 uModel;
uniform mat3 uNormals;
out vec3 vNormal;
out vec3 vLocal;
out vec3 vWorld;
void main() {
  vLocal = position;
  vNormal = normalize(uNormals * normal);
  vec4 world = uModel * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = uViewProjection * world;
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vLocal;
in vec3 vWorld;
uniform int uKind;
uniform vec3 uTone;
uniform float uAlpha;
uniform float uCheer;
uniform float uBlink;
// Dazed: the eyes are crosses.
uniform float uDizzy;
// Wireframes: 1 draws a fill flat white, unlit, behind its lines.
uniform float uFlat;
// A visor on the front (+z) that a wireframe's lines leave clear:
// centre height, half width, half height, corner. Zero width for none.
uniform vec4 uVisor;
uniform vec3 uCamera;
out vec4 fragment;

// The void things fade into, and every line's colour, set for the theme.
uniform vec3 uVoid;
uniform vec3 uLine;
#define VOID uVoid
const vec3 SUN = normalize(vec3(-0.35, 1.0, 0.55));
// Every line, the models' wireframes included: the app's button blue,
// #3981ED in Display P3, which is #0383F5 in the canvas's sRGB; lighter in
// the dark.
#define LINE uLine
const vec3 INK = vec3(0.07, 0.08, 0.08);
const vec3 EYE = vec3(0.918, 0.965, 1.0);
const vec3 GLOW = vec3(0.435, 0.655, 0.788);
const vec3 TRIM = vec3(0.498, 0.529, 0.576);
// As bright and vivid as the screen allows: hot pink at the top to pure red
// at the point.
const vec3 HEART_TOP = vec3(1.0, 0.36, 0.62);
const vec3 HEART_POINT = vec3(1.0, 0.04, 0.24);

float inside(float distance) {
  return clamp(0.5 - distance / max(fwidth(distance), 1e-5), 0.0, 1.0);
}

float rounded(vec2 point, vec2 half_size, float corner) {
  vec2 past = abs(point) - half_size + corner;
  return min(max(past.x, past.y), 0.0) + length(max(past, 0.0)) - corner;
}

// A box's edges, about \`pixels\` wide on screen at any distance: on each
// face, where either of the face's two other coordinates nears the edge.
float edges(vec3 local, float pixels) {
  vec3 a = abs(local);
  vec3 near = 1.0 - a;
  vec3 width = fwidth(a) * pixels;
  vec3 line = 1.0 - smoothstep(width * 0.5, width * 1.5, near);
  if (a.x >= a.y && a.x >= a.z) return max(line.y, line.z);
  if (a.y >= a.z) return max(line.x, line.z);
  return max(line.x, line.y);
}

// Grid lines every \`size\` in the world's x and z, about a pixel wide.
float grid(vec2 at, float size) {
  vec2 cell = at / size;
  vec2 off = abs(fract(cell - 0.5) - 0.5) / max(fwidth(cell), vec2(1e-5));
  return 1.0 - clamp(min(off.x, off.y), 0.0, 1.0);
}

void main() {
  float distance = length(uCamera - vWorld);
  float fog = smoothstep(22.0, 70.0, distance);

  if (uKind == ${KIND.shadow}) {
    // A soft shadow in its tone (black, or a tint), blended over the ground.
    float fade = 1.0 - smoothstep(0.3, 1.0, length(vLocal.xz));
    float dark = 0.12 * fade * uAlpha;
    fragment = vec4(uTone * dark, dark);
    return;
  }
  if (uKind == ${KIND.wire}) {
    // A wireframe's edges, dark, but not across its visor.
    if (uVisor.y > 0.0 && vLocal.z > 0.0 && rounded(vLocal.xy - vec2(0.0, uVisor.x), uVisor.yz + 0.04, uVisor.w) < 0.0) discard;
    // Far away, fading into the sky behind the game.
    fragment = vec4(mix(VOID, LINE, 0.82) * (1.0 - fog), 1.0 - fog);
    return;
  }
  if (uKind == ${KIND.floor}) {
    // The void's floor: a faint wire grid, fading away.
    float lines = max(grid(vWorld.xz, 2.0) * 0.35, grid(vWorld.xz, 10.0) * 0.5);
    float fade = 1.0 - smoothstep(18.0, 60.0, distance);
    // The floor itself fades into the sky with distance, so there's no edge
    // at the horizon.
    float there = 1.0 - smoothstep(28.0, 75.0, distance);
    fragment = vec4(mix(VOID, LINE, lines * 0.13 * fade) * there, there);
    return;
  }

  vec3 normal = normalize(vNormal);
  vec3 tone = uTone;
  vec3 seen = normalize(uCamera - vWorld);
  float facing = dot(normal, SUN);
  float lit = mix(mix(0.8, 1.0, smoothstep(-0.1, 0.6, facing)), 1.0, uFlat);
  float rim = pow(1.0 - max(dot(normal, seen), 0.0), 2.5) * (1.0 - uFlat);
  vec3 color = tone * lit;

  if (uKind == ${KIND.box} || uKind == ${KIND.track}) {
    // Flat light faces, brightest on top, with crisp dark edges.
    // Whites, with only a whisper of shade on the sides.
    color = tone * mix(0.985, 1.0, smoothstep(0.5, 0.9, normal.y)) * mix(0.995, 1.0, smoothstep(-0.2, 0.6, facing));
    // A wire grid on every face, on the face's own plane: every metre on the
    // track's top, every half metre on the walls, barriers and sides.
    vec3 axis = abs(normal);
    vec2 plane = axis.y > 0.5 ? vWorld.xz : axis.x > 0.5 ? vWorld.zy : vWorld.xy;
    bool isTop = uKind == ${KIND.track} && normal.y > 0.5;
    color = mix(color, LINE, grid(plane, isTop ? 1.0 : 0.5) * (isTop ? 0.07 : 0.16));
    color = mix(color, LINE, edges(vLocal, 1.25) * 0.85);
  }
  if (uKind == ${KIND.plain}) {
    // Soft-lit, with a faint dark rim so it reads against the light.
    color = tone * lit * (1.0 - 0.12 * rim);
  }
  if (uKind == ${KIND.visor} || uKind == ${KIND.robotHead}) {
    // A visor with two glowing eyes on the front, as on the robots.
    bool isRobot = uKind == ${KIND.robotHead};
    vec2 half_visor = isRobot ? vec2(0.64, 0.32) : vec2(0.62, 0.36);
    vec2 face = vLocal.xy - vec2(0.0, isRobot ? 0.01 : 0.05);
    float front = step(0.0, vLocal.z);
    // The white bot's head has a pale band at its base, as the guide's does.
    // Wireframes leave the shell plain.
    if (!isRobot && uFlat < 0.5) color = mix(color, vec3(0.86, 0.875, 0.9) * lit, inside(vLocal.y + 0.6));
    if (isRobot && uFlat < 0.5) {
      color = mix(color, TRIM * lit, inside(vLocal.y + 0.44));
      color = mix(color, vec3(0.6, 0.631, 0.675) * lit, front * inside(rounded(face, half_visor + 0.06, 0.28)));
    }
    float visor = front * inside(rounded(face, half_visor, 0.22));
    vec2 eye = vec2(abs(face.x) - (isRobot ? 0.25 : 0.24), face.y);
    float tall = (isRobot ? 0.2 : 0.17) * (1.0 - 0.9 * uBlink) * (1.0 - 0.45 * uCheer);
    float shape = rounded(eye, vec2(0.085, tall), min(0.085, tall));
    float outward = eye.x / 0.085;
    shape = max(shape, mix(-tall - 0.1, tall - 0.06 - 1.1 * outward * outward * tall, uCheer) - eye.y);
    // Dazed: each eye a cross.
    vec2 slash = vec2(eye.x + eye.y, eye.y - eye.x) * 0.7071;
    vec2 back_slash = vec2(eye.x - eye.y, eye.x + eye.y) * 0.7071;
    float cross_eye = min(rounded(slash, vec2(0.11, 0.026), 0.026), rounded(back_slash, vec2(0.11, 0.026), 0.026));
    shape = mix(shape, cross_eye, step(0.5, uDizzy));
    vec3 screen = mix(INK, GLOW, 0.35 * (1.0 - smoothstep(0.0, 0.08, shape)));
    screen = mix(screen, EYE, inside(shape));
    color = mix(color * (1.0 - 0.15 * rim), screen, visor);
  }
  if (uKind == ${KIND.heart}) {
    // Vivid but matte: the bright gradient with only a gentle shade from
    // the light and towards the edges, so it stays round without looking
    // like plastic. (Its normals may face either way, so they're turned to
    // the camera first.)
    float down = smoothstep(0.3, -0.3, vLocal.y);
    vec3 gradient = mix(HEART_TOP, HEART_POINT, down);
    vec3 toward = dot(normal, seen) < 0.0 ? -normal : normal;
    float edge = 1.0 - abs(dot(toward, seen));
    float shade = mix(0.92, 1.03, smoothstep(-0.3, 0.7, dot(toward, SUN)));
    color = min(gradient * shade * (1.0 - 0.16 * edge * edge), vec3(1.0));
    // Far hearts stay vivid: they fade into the sky much less.
    fog *= 0.35;
  }
  // Far away, fading into the sky behind the game.
  float near = (1.0 - fog) * uAlpha;
  fragment = vec4(color * near, near);
}`;

interface Mesh {
  readonly vertexArray: WebGLVertexArrayObject;
  readonly count: number;
  readonly mode: number;
}

// A wireframe: the shape filled, drawn flat and a hair behind, and its grid of edges as lines.
export interface Wire {
  readonly fill: Mesh;
  readonly lines: Mesh;
}

export interface Look {
  readonly tone: number[];
  readonly kind?: number;
  readonly alpha?: number;
  // How far the eyes are smiling, from 0 to 1.
  readonly cheer?: number;
  // A visor on the front, left clear of a wireframe's lines: centre height, half width, half
  // height and corner.
  readonly visor?: number[];
  // Drawn flat and unlit, as a wireframe's fill is.
  readonly isFlat?: boolean;
}

// The edges of a surface made of `around` columns: the rings and the lines from pole to pole,
// not the diagonals.
const getGridEdges = (shape: Shape, around: number) => {
  const rows = shape.positions.length / 3 / around;
  const edges: number[] = [];
  for (let row = 0; row < rows; row += 1)
    for (let column = 0; column < around; column += 1) {
      const here = row * around + column;
      edges.push(here, row * around + ((column + 1) % around));
      if (row + 1 < rows) edges.push(here, here + around);
    }
  return edges;
};

// A flat view with no vanishing point: `reach` is half the height of what it shows.
const getParallel = (reach: number, aspect: number, near: number, far: number) =>
  new Float32Array([
    1 / (reach * aspect),
    0,
    0,
    0,
    0,
    1 / reach,
    0,
    0,
    0,
    0,
    2 / (near - far),
    0,
    0,
    0,
    (far + near) / (near - far),
    1,
  ]);

// A view with a vanishing point, which shows `reach` as half its height at `distance`.
const getPerspective = (
  reach: number,
  aspect: number,
  distance: number,
  near: number,
  far: number,
) =>
  new Float32Array([
    distance / (reach * aspect),
    0,
    0,
    0,
    0,
    distance / reach,
    0,
    0,
    0,
    0,
    (far + near) / (near - far),
    -1,
    0,
    0,
    (2 * far * near) / (near - far),
    0,
  ]);

// The camera's own axes: to its right, up, and back from what it looks at.
export const getCameraAxes = (eye: Vec3, target: Vec3) => {
  const away = { x: eye.x - target.x, y: eye.y - target.y, z: eye.z - target.z };
  const length = Math.hypot(away.x, away.y, away.z);
  const back = { x: away.x / length, y: away.y / length, z: away.z / length };
  const side = cross({ x: 0, y: 1, z: 0 }, back);
  const width = Math.hypot(side.x, side.y, side.z);
  const right = { x: side.x / width, y: side.y / width, z: side.z / width };
  return { right, up: cross(back, right), back };
};

const getDot = (first: Vec3, second: Vec3) =>
  first.x * second.x + first.y * second.y + first.z * second.z;

const getView = (eye: Vec3, target: Vec3) => {
  const axes = getCameraAxes(eye, target);
  return new Float32Array([
    axes.right.x,
    axes.up.x,
    axes.back.x,
    0,
    axes.right.y,
    axes.up.y,
    axes.back.y,
    0,
    axes.right.z,
    axes.up.z,
    axes.back.z,
    0,
    -getDot(axes.right, eye),
    -getDot(axes.up, eye),
    -getDot(axes.back, eye),
    1,
  ]);
};

const multiply = (first: Float32Array, second: Float32Array) => {
  const product = new Float32Array(16);
  for (let column = 0; column < 4; column += 1)
    for (let row = 0; row < 4; row += 1) {
      let sum = 0;
      for (let index = 0; index < 4; index += 1)
        sum += first[index * 4 + row] * second[column * 4 + index];
      product[column * 4 + row] = sum;
    }
  return product;
};

export type Renderer = NonNullable<ReturnType<typeof createRenderer>>;

// Returns nothing where the browser has no WebGL2, or cannot build the shader.
export const createRenderer = (canvas: HTMLCanvasElement) => {
  // See-through where nothing is drawn, so the page shows behind.
  const gl = canvas.getContext("webgl2", {
    antialias: true,
    alpha: true,
    premultipliedAlpha: true,
  });
  if (!gl) return undefined;
  const program = gl.createProgram();
  const vertex = gl.createShader(gl.VERTEX_SHADER);
  const fragment = gl.createShader(gl.FRAGMENT_SHADER);
  if (!vertex || !fragment) return undefined;
  gl.shaderSource(vertex, VERTEX);
  gl.shaderSource(fragment, FRAGMENT);
  gl.compileShader(vertex);
  gl.compileShader(fragment);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  const uniforms = {
    viewProjection: gl.getUniformLocation(program, "uViewProjection"),
    model: gl.getUniformLocation(program, "uModel"),
    normals: gl.getUniformLocation(program, "uNormals"),
    kind: gl.getUniformLocation(program, "uKind"),
    tone: gl.getUniformLocation(program, "uTone"),
    alpha: gl.getUniformLocation(program, "uAlpha"),
    cheer: gl.getUniformLocation(program, "uCheer"),
    blink: gl.getUniformLocation(program, "uBlink"),
    dizzy: gl.getUniformLocation(program, "uDizzy"),
    flat: gl.getUniformLocation(program, "uFlat"),
    visor: gl.getUniformLocation(program, "uVisor"),
    camera: gl.getUniformLocation(program, "uCamera"),
    void: gl.getUniformLocation(program, "uVoid"),
    line: gl.getUniformLocation(program, "uLine"),
  };

  const store = (shape: Shape, lines?: number[]): Mesh => {
    const indices = lines ?? shape.indices;
    const vertexArray = gl.createVertexArray();
    gl.bindVertexArray(vertexArray);
    [shape.positions, shape.normals].forEach((values, location) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
    });
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return { vertexArray, count: indices.length, mode: lines ? gl.LINES : gl.TRIANGLES };
  };

  const storeWire = (shape: Shape, around: number): Wire => ({
    fill: store(shape),
    lines: store(shape, getGridEdges(shape, around)),
  });

  // Clears the canvas at its size on the page and sets the camera. Returns its width over its
  // height.
  const begin = (eye: Vec3, target: Vec3, reach: number, isPerspective: boolean) => {
    const ratio = Math.min(devicePixelRatio, 2);
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const aspect = width / Math.max(height, 1);
    gl.uniformMatrix4fv(
      uniforms.viewProjection,
      false,
      multiply(
        isPerspective
          ? getPerspective(
              reach,
              aspect,
              Math.hypot(eye.x - target.x, eye.y - target.y, eye.z - target.z),
              0.3,
              120,
            )
          : getParallel(reach, aspect, 0.3, 120),
        getView(eye, target),
      ),
    );
    gl.uniform3f(uniforms.camera, eye.x, eye.y, eye.z);
    const theme = isDark() ? THEMES.dark : THEMES.light;
    gl.uniform3fv(uniforms.void, theme.void);
    gl.uniform3fv(uniforms.line, theme.line);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    return aspect;
  };

  const draw = (mesh: Mesh, frame: Frame, look: Look) => {
    gl.uniformMatrix4fv(uniforms.model, false, [
      ...[frame.right, frame.up, frame.forward].flatMap((axis) => [axis.x, axis.y, axis.z, 0]),
      frame.origin.x,
      frame.origin.y,
      frame.origin.z,
      1,
    ]);
    gl.uniformMatrix3fv(
      uniforms.normals,
      false,
      [
        cross(frame.up, frame.forward),
        cross(frame.forward, frame.right),
        cross(frame.right, frame.up),
      ].flatMap((axis) => [axis.x, axis.y, axis.z]),
    );
    gl.uniform1i(uniforms.kind, look.kind ?? KIND.plain);
    gl.uniform3fv(uniforms.tone, look.tone);
    gl.uniform1f(uniforms.alpha, look.alpha ?? 1);
    gl.uniform1f(uniforms.cheer, look.cheer ?? 0);
    gl.uniform1f(uniforms.blink, 0);
    gl.uniform1f(uniforms.dizzy, 0);
    gl.uniform1f(uniforms.flat, look.isFlat ? 1 : 0);
    gl.uniform4fv(uniforms.visor, look.visor ?? [0, 0, 0, 0]);
    gl.bindVertexArray(mesh.vertexArray);
    gl.drawElements(mesh.mode, mesh.count, gl.UNSIGNED_SHORT, 0);
  };

  // A wireframe's fill goes a hair back, so only the lines in front of it show over it.
  const drawWire = (shape: Wire, frame: Frame, look: Look) => {
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 1);
    draw(shape.fill, frame, { ...look, isFlat: true });
    gl.disable(gl.POLYGON_OFFSET_FILL);
    draw(shape.lines, frame, { ...look, kind: KIND.wire });
  };

  // See-through things go last, over what is solid, without writing depth.
  const drawBlended = (paint: () => void) => {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(-1, -1);
    paint();
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  };

  return { store, storeWire, begin, draw, drawWire, drawBlended };
};
