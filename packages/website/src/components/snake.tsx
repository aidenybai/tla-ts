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
const STEP_MS = 260;
const REPLAY_MS = 100;
const HINT_STEPS = 40;
const SNAKE_FILL = "fill-[oklch(58%_0.17_295)]";
const SHADE_FILL = "fill-[oklch(35%_0.08_140)]/25";
const SHADE_STROKE = "stroke-[oklch(35%_0.08_140)]/25";

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

const isBitten = (snake: Snake) => snake.body.slice(1).includes(snake.body[0]);

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

const isBeside = (first: Point, second: Point) =>
  Math.max(Math.abs(first.x - second.x), Math.abs(first.y - second.y)) <= CELL;

const getBetween = (from: Point, to: Point, progress: number): Point => ({
  x: from.x + (to.x - from.x) * progress,
  y: from.y + (to.y - from.y) * progress,
});

// The points down the snake's back, part of the way through a step: the head has left its old
// square and the tail has not yet left its own. A snake that did not just step, or that came in
// from the far edge, is drawn where it is.
const getBack = (from: number[], to: number[], progress: number): Point[] => {
  const last = to.map(getCenter);
  const first = from.map(getCenter);
  const isStep =
    to.length >= from.length &&
    from.every((square, index) => index === from.length - 1 || to[index + 1] === square) &&
    isBeside(first[0], last[0]) &&
    isBeside(first[first.length - 1], first[first.length - 2]);
  if (!isStep || progress >= 1) return last;
  const tail =
    to.length === from.length
      ? getBetween(first[first.length - 1], first[first.length - 2], progress)
      : first[first.length - 1];
  return [getBetween(first[0], last[0], progress), ...first.slice(0, -1), tail];
};

// The line through the points. It lifts where the snake leaves one edge and comes in at the
// other, so that no stroke crosses the board.
const getBackPath = (points: Point[]) =>
  points
    .map((point, index) => {
      const isJoined = index > 0 && isBeside(points[index - 1], point);
      return `${isJoined ? "L" : "M"}${point.x} ${point.y}${isJoined ? "" : "h0"}`;
    })
    .join("");

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
  const [stepCount, setStepCount] = useState(0);
  const [heldKeys, setHeldKeys] = useState<ReadonlySet<string>>(new Set());
  const isTouch = useMediaQuery("(hover: none) and (pointer: coarse)");
  const [isMoving, setIsMoving] = useState(false);
  const [replay, setReplay] = useState<Replay>();
  if (props.search && replay?.search !== props.search) {
    setReplay({ search: props.search, index: 0 });
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
  const [hoveredId, setHoveredId] = useState<string>();
  const isReplayShown = replay !== undefined && replay.index >= 0 && tried.length > 0;
  const isReplaying = isReplayShown && replay.index < tried.length - 1;
  const active = isReplayShown
    ? ((isReplaying ? undefined : tried.find((state) => state.id === hoveredId)) ??
      tried[Math.min(replay.index, tried.length - 1)])
    : undefined;
  const shown = useMemo(() => (active ? getSnake(active) : snake), [active, snake]);
  const hasBitten = isBitten(shown);
  const boardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(boardRef, { amount: 0.5 });
  const steer = (next: Direction) => {
    if (isReplaying || isBitten(snake)) return;
    setReplay(replay && { ...replay, index: -1 });
    setSnake(turn(isReplayShown ? START : snake, next));
    if (isReplayShown) setStepCount(0);
    setIsMoving(true);
  };
  useEffect(() => {
    if (!isReplaying) return;
    const timer = setInterval(
      () => setReplay((current) => current && { ...current, index: current.index + 1 }),
      REPLAY_MS,
    );
    return () => clearInterval(timer);
  }, [isReplaying]);
  useEffect(() => {
    if (!isMoving || !isInView || isBitten(snake)) return;
    const timer = setInterval(() => {
      setSnake(step);
      setStepCount((count) => count + 1);
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [isMoving, isInView, snake]);
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
  const backId = useId();
  const backRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const lastBodyRef = useRef(shown.body);
  // A step glides from one square to the next. Each frame is written to the drawing itself, so
  // that sixty frames a second do not render the game sixty times.
  useLayoutEffect(() => {
    const from = lastBodyRef.current;
    lastBodyRef.current = shown.body;
    const draw = (progress: number) => {
      const points = getBack(from, shown.body, progress);
      backRef.current?.setAttribute("d", getBackPath(points));
      headRef.current?.setAttribute("transform", `translate(${points[0].x} ${points[0].y})`);
    };
    if (isReplayShown || matchMedia("(prefers-reduced-motion: reduce)").matches) return draw(1);
    const start = performance.now();
    let frame = requestAnimationFrame(function glide(now) {
      const progress = Math.min(1, Math.max(0, (now - start) / STEP_MS));
      draw(progress);
      if (progress < 1) frame = requestAnimationFrame(glide);
    });
    draw(0);
    return () => cancelAnimationFrame(frame);
  }, [shown.body, isReplayShown]);
  const steps = props.search?.states.flatMap((state) => state.call ?? []) ?? [];
  return (
    <div className="my-4 flex flex-wrap gap-x-10 gap-y-6 rounded-[22px] bg-card p-5 shadow-raised sm:-mx-6 sm:p-7 lg:-mx-10">
      <div
        ref={boardRef}
        // A click heads the snake for the eighth of a turn nearest to it.
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const head = getCenter(snake.body[0]);
          const angle = Math.atan2(
            ((event.clientX - box.left) / box.width) * SIZE * CELL - head.x,
            head.y - ((event.clientY - box.top) / box.width) * SIZE * CELL,
          );
          steer(DIRECTIONS[(Math.round(angle / (Math.PI / 4)) + 8) % 8]);
        }}
        className={cn(
          "mb-1 w-full max-w-[294px] shrink-0 cursor-pointer self-start overflow-hidden rounded-lg shadow-[0_4px_0_oklch(80%_0.08_140)] dark:shadow-[0_4px_0_oklch(22%_0.04_140)]",
          hasBitten && "motion-safe:animate-shake",
        )}
      >
        <svg
          role="img"
          aria-label="A snake and an apple on a board. The arrow keys steer the snake, and so does a click on the board."
          viewBox={`0 0 ${SIZE * CELL} ${SIZE * CELL}`}
          className="block w-full"
        >
          {Array.from({ length: SIZE * SIZE }, (_square, index) => (
            <rect
              key={index}
              x={(index % SIZE) * CELL}
              y={Math.floor(index / SIZE) * CELL}
              width={CELL}
              height={CELL}
              className={
                index % 2 === 0
                  ? "fill-[oklch(93%_0.05_140)] dark:fill-[oklch(31%_0.04_140)]"
                  : "fill-[oklch(90%_0.06_140)] dark:fill-[oklch(28%_0.04_140)]"
              }
            />
          ))}
          <defs>
            <path
              ref={backRef}
              id={backId}
              d={getBackPath(shown.body.map(getCenter))}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </defs>
          <g transform={`translate(${getCenter(shown.apple).x} ${getCenter(shown.apple).y})`}>
            <g
              key={shown.apple}
              className="origin-center [transform-box:fill-box] motion-safe:animate-chip-in"
            >
              <ellipse cy={3.3} rx={2.8} ry={1} className={SHADE_FILL} />
              <path
                d="M0 -2.4 Q0.4 -3.8 1.8 -4"
                fill="none"
                strokeWidth={0.7}
                strokeLinecap="round"
                className="stroke-[oklch(45%_0.08_60)]"
              />
              <ellipse
                cx={1.6}
                cy={-3.1}
                rx={1.3}
                ry={0.7}
                className="fill-[oklch(65%_0.16_140)]"
              />
              <circle r={3} className="fill-[oklch(62%_0.21_27)]" />
              <path
                d="M-2.6 0.6 A3 3 0 0 0 2.6 0.6 A3.4 3 0 0 1 -2.6 0.6"
                className="fill-[oklch(52%_0.2_27)]"
              />
              <circle cx={-1} cy={-1.1} r={0.8} className="fill-white/50" />
            </g>
          </g>
          <use href={`#${backId}`} y={1.3} strokeWidth={6.6} className={SHADE_STROKE} />
          <use
            href={`#${backId}`}
            strokeWidth={6.6}
            className={hasBitten ? "stroke-destructive" : "stroke-[oklch(58%_0.17_295)]"}
          />
          <use href={`#${backId}`} y={-1.2} strokeWidth={1.8} className="stroke-white/25" />
          <g
            ref={headRef}
            transform={`translate(${getCenter(shown.body[0]).x} ${getCenter(shown.body[0]).y})`}
          >
            <circle cy={1.3} r={4} className={SHADE_FILL} />
            <circle r={4} className={hasBitten ? "fill-destructive" : SNAKE_FILL} />
            <circle cx={-0.6} cy={-1.4} r={2.2} className="fill-white/15" />
            <g transform={`rotate(${DIRECTIONS.indexOf(shown.direction) * 45})`}>
              <circle cx={-1.9} cy={-1.6} r={1.5} className="fill-white" />
              <circle cx={1.9} cy={-1.6} r={1.5} className="fill-white" />
              <circle cx={-1.9} cy={-2.1} r={0.75} className="fill-[oklch(25%_0.05_295)]" />
              <circle cx={1.9} cy={-2.1} r={0.75} className="fill-[oklch(25%_0.05_295)]" />
            </g>
          </g>
        </svg>
      </div>
      {/* The column keeps the board's height, with its buttons at the foot, so that a longer line
          or the tree moves nothing. */}
      <div className="flex min-h-44 min-w-56 flex-1 flex-col items-start gap-4 self-stretch">
        {hasBitten && !isReplayShown && (
          <p className="flex items-center gap-1.5 rounded-md bg-destructive/15 px-2 py-0.5 text-sm text-destructive motion-safe:animate-drop-in">
            <Bug weight="fill" className="size-3.5" />
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
            "It can\u2019t reverse, so it should never bite itself. Make it."
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
                setStepCount(0);
                setIsMoving(false);
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
