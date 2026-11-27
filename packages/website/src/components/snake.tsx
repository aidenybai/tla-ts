import { Bug } from "@phosphor-icons/react";
import { useInView } from "motion/react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "cn";
import type { Search, SearchState } from "@/lib/search";
import { SearchTree } from "./search-tree";
import { Button } from "@/components/ui/button";
import { KeyCap } from "@/components/ui/key-cap";
import { useMediaQuery } from "@/hooks/use-media-query";

// The board of the example's code, and its two moves, with the mistake in `turn`.
const SIZE = 7;
const CELL = 10;
const BOARD = SIZE * CELL;
const STEP_MS = 190;
const REPLAY_MS = 100;
const HINT_STEPS = 45;

// The board drawn again on each side of itself, so a snake that leaves by one edge is already
// coming in at the other.
const TILES = [-BOARD, 0, BOARD]
  .flatMap((x) => [-BOARD, 0, BOARD].map((y) => ({ x, y })))
  .filter((tile) => tile.x !== 0 || tile.y !== 0);

// The eight ways to move, clockwise from up, each an eighth of a turn from the last.
const DIRECTIONS = [
  { name: "up", move: [0, -1], key: "ArrowUp" },
  { name: "upRight", move: [1, -1], key: undefined },
  { name: "right", move: [1, 0], key: "ArrowRight" },
  { name: "downRight", move: [1, 1], key: undefined },
  { name: "down", move: [0, 1], key: "ArrowDown" },
  { name: "downLeft", move: [-1, 1], key: undefined },
  { name: "left", move: [-1, 0], key: "ArrowLeft" },
  { name: "upLeft", move: [-1, -1], key: undefined },
] as const;

type Direction = (typeof DIRECTIONS)[number];

interface Snake {
  // The squares of the snake, head first.
  body: number[];
  apple: number;
  direction: Direction;
}

const START: Snake = { body: [23, 22, 21], apple: 26, direction: DIRECTIONS[2] };

const turn = (snake: Snake, next: Direction): Snake =>
  next === DIRECTIONS[(DIRECTIONS.indexOf(snake.direction) + 4) % 8]
    ? snake
    : { ...snake, direction: next };

const step = (snake: Snake): Snake => {
  const x = ((snake.body[0] % SIZE) + snake.direction.move[0] + SIZE) % SIZE;
  const y = (Math.floor(snake.body[0] / SIZE) + snake.direction.move[1] + SIZE) % SIZE;
  const head = y * SIZE + x;
  return head === snake.apple
    ? { ...snake, body: [head, ...snake.body], apple: (snake.apple * 5 + 3) % (SIZE * SIZE) }
    : { ...snake, body: [head, ...snake.body.slice(0, -1)] };
};

const isBitten = (body: number[]) => body.slice(1).includes(body[0]);

const getSnake = (state: SearchState): Snake => {
  const values = new Map(state.variables.map((variable) => [variable.name, variable.value]));
  return {
    body: (values.get("snake")?.match(/\d+/g) ?? []).map(Number),
    apple: Number(values.get("apple")),
    direction:
      DIRECTIONS.find((found) => values.get("direction") === `"${found.name}"`) ?? START.direction,
  };
};

interface Point {
  x: number;
  y: number;
}

const getCenter = (square: number): Point => ({
  x: (square % SIZE) * CELL + CELL / 2,
  y: Math.floor(square / SIZE) * CELL + CELL / 2,
});

// The short way from one square to a square beside it, which is over the edge where the
// second lies on the far side of the board.
const getShortWay = (from: number, to: number) => (((to - from + SIZE + 3) % SIZE) - 3) * CELL;

const getBetween = (from: Point, to: Point, progress: number): Point => ({
  x: from.x + (to.x - from.x) * progress,
  y: from.y + (to.y - from.y) * progress,
});

// The points down the snake's back, from its head. Each follows the last the short way, so
// the line runs off the board where the snake crosses an edge and never back across it.
const getBack = (body: number[]) =>
  body.reduce<Point[]>((points, square, index) => {
    const last = points.at(-1);
    points.push(
      last === undefined
        ? getCenter(square)
        : {
            x: last.x + getShortWay(body[index - 1] % SIZE, square % SIZE),
            y: last.y + getShortWay(Math.floor(body[index - 1] / SIZE), Math.floor(square / SIZE)),
          },
    );
    return points;
  }, []);

// The same points part of the way through a step: the head has left its old square and the
// tail has not yet left its own. A snake that did not just step is drawn where it is.
const getPose = (from: number[] | undefined, to: number[], progress: number) => {
  if (from === undefined || to[1] !== from[0] || progress >= 1) return getBack(to);
  const back = getBack(from);
  const head = {
    x: back[0].x + getShortWay(from[0] % SIZE, to[0] % SIZE),
    y: back[0].y + getShortWay(Math.floor(from[0] / SIZE), Math.floor(to[0] / SIZE)),
  };
  const tail =
    to.length === from.length
      ? getBetween(back[back.length - 1], back[back.length - 2], progress)
      : back[back.length - 1];
  return [getBetween(back[0], head, progress), ...back.slice(0, -1), tail];
};

const getPath = (points: Point[]) =>
  points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join("");

const START_BACK = getBack(START.body);

interface Replay {
  search: Search;
  // The state of the search on the board. It is past the last one once every state has shown,
  // and below zero once the reader has taken the board back.
  index: number;
}

interface SnakeGameProps {
  // The search of the last run, whose states the board plays back in the order it tried them.
  search: Search | undefined;
  isRunning: boolean;
  onRun: () => void;
}

export const SnakeGame = (props: SnakeGameProps) => {
  const [snake, setSnake] = useState(START);
  // The apple on the board, which stays until the head has reached it.
  const [apple, setApple] = useState(START.apple);
  const [stepCount, setStepCount] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [heldKeys, setHeldKeys] = useState<ReadonlySet<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string>();
  const [replay, setReplay] = useState<Replay>();
  const isTouch = useMediaQuery("(hover: none) and (pointer: coarse)");
  const isReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  if (props.search && replay?.search !== props.search) {
    // A reader who asked for less motion sees where the search ended, not each state it tried.
    setReplay({ search: props.search, index: isReduced ? Infinity : 0 });
    setIsMoving(false);
  }
  // The states the search tried, with the one that breaks the rule last.
  const tried = useMemo(() => {
    const states = props.search?.checkedStates ?? [];
    return [
      ...states.filter((state) => !state.isFailing),
      ...states.filter((state) => state.isFailing),
    ];
  }, [props.search]);
  const isReplayShown = replay !== undefined && replay.index >= 0 && tried.length > 0;
  const isReplaying = isReplayShown && replay.index < tried.length - 1;
  const active = isReplayShown
    ? ((isReplaying ? undefined : tried.find((state) => state.id === hoveredId)) ??
      tried[Math.min(replay.index, tried.length - 1)])
    : undefined;
  const shown = useMemo(() => (active ? getSnake(active) : snake), [active, snake]);
  const hasBitten = isReplayShown ? isBitten(shown.body) : isOver;
  const boardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(boardRef, { amount: 0.5 });
  const isGliding = isMoving && isInView && !isOver && !isReplayShown;

  const snakeId = useId();
  const backId = useId();
  const softId = useId();
  const grassId = useId();
  const lightId = useId();
  const appleId = useId();
  const headId = useId();
  const backRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGGElement>(null);
  // The step on the board: the squares the snake is leaving, the ones it is taking, and when
  // it set off. Each frame is drawn from these, so sixty frames a second render nothing.
  const glideRef = useRef({
    from: undefined as number[] | undefined,
    to: START,
    startedAt: 0,
    nextStartAt: 0,
    isStepDue: false,
  });
  const draw = (points: Point[]) => {
    backRef.current?.setAttribute("d", getPath(points));
    headRef.current?.setAttribute("transform", `translate(${points[0].x} ${points[0].y})`);
  };
  useLayoutEffect(() => {
    const glide = glideRef.current;
    const last = glide.to.body;
    glide.to = shown;
    if (!isGliding) {
      glide.from = undefined;
      return draw(getBack(shown.body));
    }
    // A turn changes where the snake is heading and not where it is, so the step under way
    // carries on.
    if (last === shown.body) return;
    glide.from = last;
    glide.startedAt = glide.nextStartAt;
    glide.isStepDue = false;
  }, [shown, isGliding]);
  // One clock moves the snake and draws it. A step starts where the last one ended, whatever
  // the reader pressed in between, so the snake keeps one pace.
  useEffect(() => {
    if (!isGliding) return;
    const glide = glideRef.current;
    glide.from = undefined;
    glide.startedAt = performance.now() - STEP_MS;
    let frame = requestAnimationFrame(function tick(now) {
      frame = requestAnimationFrame(tick);
      const elapsed = now - glide.startedAt;
      draw(getPose(glide.from, glide.to.body, isReduced ? 1 : Math.max(0, elapsed / STEP_MS)));
      if (elapsed < STEP_MS || glide.isStepDue) return;
      glide.isStepDue = true;
      // A frame that came late starts the next step now, so the snake does not leap to catch up.
      glide.nextStartAt = elapsed > STEP_MS * 2 ? now : glide.startedAt + STEP_MS;
      setApple(glide.to.apple);
      if (isBitten(glide.to.body)) return setIsOver(true);
      setSnake(step);
      setStepCount((count) => count + 1);
    });
    return () => cancelAnimationFrame(frame);
  }, [isGliding, isReduced]);
  useEffect(() => {
    if (!isReplaying) return;
    const timer = setInterval(
      () => setReplay((current) => current && { ...current, index: current.index + 1 }),
      REPLAY_MS,
    );
    return () => clearInterval(timer);
  }, [isReplaying]);

  const steer = (next: Direction) => {
    if (isReplaying) return;
    // A turn after the end, or after TLA-ts has had the board, starts a new game.
    const isFresh = isReplayShown || isOver;
    setReplay(replay && { ...replay, index: -1 });
    setSnake(turn(isFresh ? START : snake, next));
    if (isFresh) {
      setApple(START.apple);
      setStepCount(0);
      setIsOver(false);
    }
    setIsMoving(true);
  };
  // The arrow keys steer the snake while the board is on screen, from wherever the focus is,
  // and scroll the page again once it is not.
  useEffect(() => {
    if (!isInView) return;
    const handleKey = (event: KeyboardEvent) => {
      const found = DIRECTIONS.find((item) => item.key === event.key);
      if (!found || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select"))
        return;
      event.preventDefault();
      if (event.repeat) return;
      setHeldKeys((held) => new Set(held).add(event.key));
      steer(found);
    };
    const handleKeyUp = (event: KeyboardEvent) =>
      setHeldKeys((held) => new Set([...held].filter((key) => key !== event.key)));
    addEventListener("keydown", handleKey);
    addEventListener("keyup", handleKeyUp);
    return () => {
      removeEventListener("keydown", handleKey);
      removeEventListener("keyup", handleKeyUp);
    };
  });
  const steps = props.search?.states.flatMap((state) => state.call ?? []) ?? [];
  const shownApple = getCenter(isReplayShown ? shown.apple : apple);
  return (
    <div className="my-4 flex flex-wrap gap-x-10 gap-y-6 rounded-[22px] bg-card p-5 shadow-raised sm:-mx-6 sm:p-7 lg:-mx-10">
      <div
        ref={boardRef}
        // A click heads the snake for the eighth of a turn nearest to it.
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const head = getCenter(snake.body[0]);
          const angle = Math.atan2(
            ((event.clientX - box.left) / box.width) * BOARD - head.x,
            head.y - ((event.clientY - box.top) / box.width) * BOARD,
          );
          steer(DIRECTIONS[(Math.round(angle / (Math.PI / 4)) + 8) % 8]);
        }}
        className={cn(
          "mb-1 w-full max-w-[294px] shrink-0 cursor-pointer touch-manipulation self-start overflow-hidden rounded-lg shadow-[0_4px_0_oklch(66%_0.11_138)] select-none dark:shadow-[0_4px_0_oklch(24%_0.05_140)]",
          hasBitten && "motion-safe:animate-shake",
        )}
      >
        <svg
          role="img"
          aria-label="A snake and an apple on a board. The arrow keys steer the snake, and so does a click on the board."
          viewBox={`0 0 ${BOARD} ${BOARD}`}
          className="block w-full"
        >
          <defs>
            <filter id={softId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.9" />
            </filter>
            <filter id={grassId} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="7" />
              <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.3  0 0 0 0 0.05  0 0 0 0.5 -0.12" />
            </filter>
            <radialGradient id={lightId} cx="30%" cy="22%" r="85%">
              <stop offset="0" className="[stop-color:white]" stopOpacity={0.22} />
              <stop offset="0.6" className="[stop-color:white]" stopOpacity={0} />
              <stop offset="1" className="[stop-color:black]" stopOpacity={0.16} />
            </radialGradient>
            <radialGradient id={appleId} cx="36%" cy="30%" r="75%">
              <stop offset="0" className="[stop-color:oklch(72%_0.2_30)]" />
              <stop offset="0.55" className="[stop-color:oklch(58%_0.22_27)]" />
              <stop offset="1" className="[stop-color:oklch(40%_0.17_22)]" />
            </radialGradient>
            <radialGradient id={headId} cx="38%" cy="30%" r="80%">
              <stop
                offset="0"
                className={
                  hasBitten ? "[stop-color:oklch(70%_0.2_27)]" : "[stop-color:oklch(74%_0.14_62)]"
                }
              />
              <stop
                offset="0.6"
                className={
                  hasBitten ? "[stop-color:oklch(57%_0.23_27)]" : "[stop-color:oklch(60%_0.15_50)]"
                }
              />
              <stop
                offset="1"
                className={
                  hasBitten ? "[stop-color:oklch(42%_0.17_25)]" : "[stop-color:oklch(44%_0.12_42)]"
                }
              />
            </radialGradient>
            {/* The game writes the snake's line and its head's place itself, frame by frame. */}
            <path
              ref={backRef}
              id={backId}
              d={getPath(START_BACK)}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </defs>
          {Array.from({ length: SIZE * SIZE }, (_square, index) => (
            <rect
              key={index}
              x={(index % SIZE) * CELL}
              y={Math.floor(index / SIZE) * CELL}
              width={CELL}
              height={CELL}
              className={
                index % 2 === 0
                  ? "fill-[oklch(84%_0.1_138)] dark:fill-[oklch(36%_0.07_140)]"
                  : "fill-[oklch(81%_0.11_138)] dark:fill-[oklch(33%_0.07_140)]"
              }
            />
          ))}
          <rect width={BOARD} height={BOARD} filter={`url(#${grassId})`} />
          <rect width={BOARD} height={BOARD} fill={`url(#${lightId})`} />
          <g transform={`translate(${shownApple.x} ${shownApple.y})`}>
            <g
              key={`${shownApple.x} ${shownApple.y}`}
              className="origin-center [transform-box:fill-box] motion-safe:animate-chip-in"
            >
              <ellipse
                cx={0.8}
                cy={3.1}
                rx={3}
                ry={1.1}
                filter={`url(#${softId})`}
                className="fill-black/35"
              />
              <circle r={3.1} fill={`url(#${appleId})`} />
              <path
                d="M-1.5 -2.6 Q0 -1.9 1.5 -2.6"
                fill="none"
                strokeWidth={0.5}
                strokeLinecap="round"
                className="stroke-black/20"
              />
              <path
                d="M0 -2.2 Q0.2 -3.6 1 -4.2"
                fill="none"
                strokeWidth={0.6}
                strokeLinecap="round"
                className="stroke-[oklch(38%_0.07_60)]"
              />
              <path
                d="M0.9 -3.6 Q2.4 -4.9 3.6 -3.6 Q2.2 -2.9 0.9 -3.6"
                className="fill-[oklch(58%_0.16_140)]"
              />
              <ellipse
                cx={-1.2}
                cy={-1.3}
                rx={0.9}
                ry={0.6}
                transform="rotate(-35 -1.2 -1.3)"
                className="fill-white/55"
              />
            </g>
          </g>
          <g id={snakeId}>
            <use
              href={`#${backId}`}
              x={0.9}
              y={1.6}
              strokeWidth={6.4}
              filter={`url(#${softId})`}
              className="stroke-black/35"
            />
            <use
              href={`#${backId}`}
              strokeWidth={6.6}
              className={hasBitten ? "stroke-[oklch(42%_0.17_25)]" : "stroke-[oklch(44%_0.12_42)]"}
            />
            <use
              href={`#${backId}`}
              x={-0.25}
              y={-0.35}
              strokeWidth={5.4}
              className={hasBitten ? "stroke-[oklch(57%_0.23_27)]" : "stroke-[oklch(60%_0.15_50)]"}
            />
            <use
              href={`#${backId}`}
              x={-0.6}
              y={-0.9}
              strokeWidth={3}
              className={hasBitten ? "stroke-[oklch(66%_0.2_27)]" : "stroke-[oklch(70%_0.14_60)]"}
            />
            {/* Saddle marks down the back. They start from the head, so they ride with the body. */}
            <use
              href={`#${backId}`}
              x={-0.3}
              y={-0.45}
              strokeWidth={2.6}
              strokeDasharray="0.01 3.4"
              strokeDashoffset={-2.2}
              className={
                hasBitten ? "stroke-[oklch(40%_0.16_25)]/70" : "stroke-[oklch(40%_0.11_35)]/75"
              }
            />
            <use
              href={`#${backId}`}
              x={-0.9}
              y={-1.4}
              strokeWidth={1}
              className="stroke-white/30"
            />
            <g ref={headRef} transform={`translate(${START_BACK[0].x} ${START_BACK[0].y})`}>
              <ellipse
                cx={0.9}
                cy={1.6}
                rx={4.2}
                ry={4.2}
                filter={`url(#${softId})`}
                className="fill-black/35"
              />
              <g transform={`rotate(${DIRECTIONS.indexOf(shown.direction) * 45})`}>
                {!hasBitten && (
                  <path
                    d="M0 -4.6 L0 -6.6 M0 -6.6 L-0.9 -7.7 M0 -6.6 L0.9 -7.7"
                    fill="none"
                    strokeWidth={0.5}
                    strokeLinecap="round"
                    className="origin-bottom scale-y-0 stroke-[oklch(55%_0.22_20)] [transform-box:fill-box] motion-safe:animate-tongue"
                  />
                )}
                <ellipse rx={3.9} ry={4.7} cy={-0.5} fill={`url(#${headId})`} />
                <circle cx={-1} cy={-4.1} r={0.3} className="fill-black/45" />
                <circle cx={1} cy={-4.1} r={0.3} className="fill-black/45" />
                <ellipse
                  cx={-2.4}
                  cy={-1.5}
                  rx={1.25}
                  ry={1.45}
                  className="fill-[oklch(95%_0.05_95)]"
                />
                <ellipse
                  cx={2.4}
                  cy={-1.5}
                  rx={1.25}
                  ry={1.45}
                  className="fill-[oklch(95%_0.05_95)]"
                />
                <ellipse
                  cx={-2.4}
                  cy={-1.8}
                  rx={0.45}
                  ry={0.95}
                  className="fill-[oklch(18%_0.03_60)]"
                />
                <ellipse
                  cx={2.4}
                  cy={-1.8}
                  rx={0.45}
                  ry={0.95}
                  className="fill-[oklch(18%_0.03_60)]"
                />
                <circle cx={-2.7} cy={-2.3} r={0.3} className="fill-white/90" />
                <circle cx={2.1} cy={-2.3} r={0.3} className="fill-white/90" />
              </g>
            </g>
          </g>
          {TILES.map((tile) => (
            <use key={`${tile.x} ${tile.y}`} href={`#${snakeId}`} x={tile.x} y={tile.y} />
          ))}
        </svg>
      </div>
      {/* The column keeps the board's height, with its buttons at the foot, so that a longer line
          or the tree moves nothing. */}
      <div className="flex min-h-44 min-w-56 flex-1 flex-col items-start gap-4 self-stretch">
        {hasBitten && !isReplayShown && (
          <p className="flex items-center gap-1.5 rounded-md bg-destructive/15 px-2 py-0.5 text-sm text-destructive motion-safe:animate-drop-in">
            <Bug weight="fill" className="size-3.5 shrink-0" />
            Bug found · It turned twice at once
          </p>
        )}
        <p aria-live="polite" className="text-pretty text-foreground tabular-nums">
          {isReplaying ? (
            `TLA-ts is trying state ${replay.index + 1} of ${tried.length}.`
          ) : isReplayShown ? (
            <>
              TLA-ts tried {tried.length} states and made the snake bite itself in {steps.length}{" "}
              moves: <span className="font-mono text-xs">{steps.join(", ")}</span>.
            </>
          ) : hasBitten ? (
            "Would your tests have tried that? See how TLA-ts gets there."
          ) : !isMoving ? (
            isTouch ? (
              "Tap the board to start the snake."
            ) : (
              <>
                Press <KeyCap isLit={heldKeys.has("ArrowUp")}>↑</KeyCap>
                <KeyCap isLit={heldKeys.has("ArrowDown")}>↓</KeyCap>
                <KeyCap isLit={heldKeys.has("ArrowRight")}>→</KeyCap> to start the snake.
              </>
            )
          ) : snake.body.length === START.body.length && stepCount < HINT_STEPS ? (
            isTouch ? (
              "Good. Tap where it should head, and eat the apple."
            ) : (
              <>
                Good. Steer with <KeyCap isLit={heldKeys.has("ArrowLeft")}>←</KeyCap>
                <KeyCap isLit={heldKeys.has("ArrowUp")}>↑</KeyCap>
                <KeyCap isLit={heldKeys.has("ArrowDown")}>↓</KeyCap>
                <KeyCap isLit={heldKeys.has("ArrowRight")}>→</KeyCap> or a click, and eat the apple.
              </>
            )
          ) : stepCount >= HINT_STEPS ? (
            isTouch ? (
              "Hint: tap twice, quickly, before it moves."
            ) : (
              <>
                Hint: turn twice before it moves, like <KeyCap>↑</KeyCap> then <KeyCap>←</KeyCap>.
              </>
            )
          ) : (
            "It can’t reverse, so it should never bite itself. Make it."
          )}
        </p>
        {isReplayShown && (
          <SearchTree
            states={tried}
            triedCount={replay.index + 1}
            activeId={active?.id}
            onHover={setHoveredId}
          />
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm">
          <Button
            variant="success"
            disabled={props.isRunning || isReplaying}
            onClick={props.onRun}
            className={cn(
              hasBitten &&
                !isReplayShown &&
                !props.isRunning &&
                "motion-safe:animate-pulse-ring motion-reduce:ring-3 motion-reduce:ring-success/40",
            )}
          >
            {props.isRunning ? "Trying every move" : "Let TLA-ts try"}
          </Button>
          {(isMoving || isReplayShown) && !isReplaying && (
            <Button
              variant="link"
              size="inline"
              onClick={() => {
                setSnake(START);
                setApple(START.apple);
                setStepCount(0);
                setIsMoving(false);
                setIsOver(false);
                setReplay(replay && { ...replay, index: -1 });
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
