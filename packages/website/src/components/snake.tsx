import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "@phosphor-icons/react";
import { useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "cn";
import type { Search, SearchState } from "@/lib/search";
import { Button } from "@/components/ui/button";

// The board of the example's code, and its two moves, with the mistake in `turn`.
const SIZE = 7;
const CELL = 10;
const STEP_MS = 260;
const REPLAY_MS = 60;
const HINT_STEPS = 40;
const SNAKE_FILL = "fill-[oklch(58%_0.17_295)]";

const DIRECTIONS = [
  { name: "up", icon: ArrowUp, key: "ArrowUp", move: [0, -1], opposite: "down", angle: 0 },
  {
    name: "left",
    icon: ArrowLeft,
    key: "ArrowLeft",
    move: [-1, 0],
    opposite: "right",
    angle: -90,
  },
  {
    name: "down",
    icon: ArrowDown,
    key: "ArrowDown",
    move: [0, 1],
    opposite: "up",
    angle: 180,
  },
  {
    name: "right",
    icon: ArrowRight,
    key: "ArrowRight",
    move: [1, 0],
    opposite: "left",
    angle: 90,
  },
] as const;
const AREAS = ["[grid-area:1/2]", "[grid-area:2/1]", "[grid-area:2/2]", "[grid-area:2/3]"];

type Direction = (typeof DIRECTIONS)[number];

interface Snake {
  // The squares of the snake, head first.
  body: number[];
  apple: number;
  direction: Direction;
}

const START: Snake = { body: [23, 22, 21], apple: 26, direction: DIRECTIONS[3] };

const turn = (snake: Snake, next: Direction): Snake =>
  next.name === snake.direction.opposite ? snake : { ...snake, direction: next };

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

const getCenter = (square: number) => ({
  x: (square % SIZE) * CELL + CELL / 2,
  y: Math.floor(square / SIZE) * CELL + CELL / 2,
});

// The line down the snake's back. It lifts where the snake leaves one edge and comes in at the
// other, so that no stroke crosses the board.
const getBackPath = (body: number[]) =>
  body
    .map((square, index) => {
      const center = getCenter(square);
      const last = index > 0 ? getCenter(body[index - 1]) : center;
      const isJoined = Math.abs(center.x - last.x) + Math.abs(center.y - last.y) === CELL;
      return `${isJoined ? "L" : "M"}${center.x} ${center.y}${isJoined ? "" : "h0"}`;
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
  const [isMoving, setIsMoving] = useState(false);
  const [replay, setReplay] = useState<Replay>();
  if (props.search && replay?.search !== props.search) {
    setReplay({ search: props.search, index: 0 });
    setIsMoving(false);
  }
  const checked = useMemo(
    () => props.search?.checkedStates.filter((state) => !state.isFailing).map(getSnake) ?? [],
    [props.search],
  );
  const failing = useMemo(() => {
    const state = props.search?.checkedStates.find((found) => found.isFailing);
    return state && getSnake(state);
  }, [props.search]);
  const isReplayShown = replay !== undefined && replay.index >= 0;
  const isReplaying = isReplayShown && replay.index < checked.length;
  const shown = isReplayShown ? (checked[replay.index] ?? failing ?? snake) : snake;
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
      steer(found);
    };
    addEventListener("keydown", handleKey);
    return () => removeEventListener("keydown", handleKey);
  });
  const steps = props.search?.states.flatMap((state) => state.call ?? []) ?? [];
  const stateCount = props.search?.checkedStates.length ?? 0;
  return (
    <div className="my-2 flex flex-wrap items-start gap-x-8 gap-y-5 rounded-[18px] bg-card p-4 shadow-raised">
      <div
        ref={boardRef}
        className={cn(
          "w-full max-w-[266px] shrink-0 overflow-hidden rounded-lg",
          hasBitten && "motion-safe:animate-shake",
        )}
      >
        <svg
          role="img"
          aria-label="A snake and an apple on a board. The arrow keys steer the snake."
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
          <g transform={`translate(${getCenter(shown.apple).x} ${getCenter(shown.apple).y})`}>
            <path
              d="M0 -2.4 Q0.4 -3.8 1.8 -4"
              fill="none"
              strokeWidth={0.7}
              strokeLinecap="round"
              className="stroke-[oklch(45%_0.08_60)]"
            />
            <ellipse cx={1.6} cy={-3.1} rx={1.3} ry={0.7} className="fill-[oklch(65%_0.16_140)]" />
            <circle r={3} className="fill-[oklch(62%_0.21_27)]" />
            <circle cx={-1} cy={-1} r={0.8} className="fill-white/40" />
          </g>
          <path
            d={getBackPath(shown.body)}
            fill="none"
            strokeWidth={6.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={hasBitten ? "stroke-destructive" : "stroke-[oklch(58%_0.17_295)]"}
          />
          <g
            transform={`translate(${getCenter(shown.body[0]).x} ${getCenter(shown.body[0]).y}) rotate(${shown.direction.angle})`}
          >
            <circle r={4} className={hasBitten ? "fill-destructive" : SNAKE_FILL} />
            <circle cx={-1.9} cy={-1.6} r={1.5} className="fill-white" />
            <circle cx={1.9} cy={-1.6} r={1.5} className="fill-white" />
            <circle cx={-1.9} cy={-2.1} r={0.75} className="fill-[oklch(25%_0.05_295)]" />
            <circle cx={1.9} cy={-2.1} r={0.75} className="fill-[oklch(25%_0.05_295)]" />
          </g>
        </svg>
      </div>
      <div className="flex min-w-48 flex-1 flex-col items-start gap-4">
        <p aria-live="polite" className="text-sm text-pretty text-muted-foreground tabular-nums">
          {isReplaying ? (
            `TLA-ts is trying state ${replay.index + 1} of ${stateCount}.`
          ) : isReplayShown ? (
            <>
              TLA-ts tried {stateCount} states and made the snake bite itself in {steps.length}{" "}
              moves: <span className="font-mono text-xs text-foreground">{steps.join(", ")}</span>.
            </>
          ) : hasBitten ? (
            "The snake bit itself. You found the bug."
          ) : stepCount >= HINT_STEPS ? (
            "Hint: turn twice before the snake moves."
          ) : (
            "Rule: the snake never bites itself. It cannot turn straight back, so it should be safe. Steer with your arrow keys, eat the apples, and make it bite anyway."
          )}
        </p>
        <div className="grid grid-cols-3 gap-1">
          {DIRECTIONS.map((item, index) => (
            <Button
              key={item.name}
              size="icon"
              aria-label={`Turn ${item.name}`}
              disabled={isReplaying || isBitten(snake)}
              onClick={() => steer(item)}
              className={AREAS[index]}
            >
              <item.icon />
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Button variant="success" disabled={props.isRunning || isReplaying} onClick={props.onRun}>
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
