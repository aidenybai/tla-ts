import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CaretUp } from "@phosphor-icons/react";
import { useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "cn";
import type { Search, SearchState } from "@/lib/search";
import { Button } from "@/components/ui/button";

// The board of the example's code, and its two moves, with the mistake in `turn`.
const SIZE = 5;
const STEP_MS = 300;
const REPLAY_MS = 60;
const HINT_STEPS = 30;

const DIRECTIONS = [
  { name: "up", icon: ArrowUp, key: "ArrowUp", move: [0, -1], opposite: "down", turn: "" },
  {
    name: "left",
    icon: ArrowLeft,
    key: "ArrowLeft",
    move: [-1, 0],
    opposite: "right",
    turn: "-rotate-90",
  },
  {
    name: "down",
    icon: ArrowDown,
    key: "ArrowDown",
    move: [0, 1],
    opposite: "up",
    turn: "rotate-180",
  },
  {
    name: "right",
    icon: ArrowRight,
    key: "ArrowRight",
    move: [1, 0],
    opposite: "left",
    turn: "rotate-90",
  },
] as const;
const AREAS = ["[grid-area:1/2]", "[grid-area:2/1]", "[grid-area:2/2]", "[grid-area:2/3]"];

type Direction = (typeof DIRECTIONS)[number];

interface Snake {
  head: number;
  neck: number;
  tail: number;
  direction: Direction;
}

const START: Snake = { head: 12, neck: 11, tail: 10, direction: DIRECTIONS[3] };

const turn = (snake: Snake, next: Direction): Snake =>
  next.name === snake.direction.opposite ? snake : { ...snake, direction: next };

const step = (snake: Snake): Snake => {
  const x = ((snake.head % SIZE) + snake.direction.move[0] + SIZE) % SIZE;
  const y = (Math.floor(snake.head / SIZE) + snake.direction.move[1] + SIZE) % SIZE;
  return { ...snake, tail: snake.neck, neck: snake.head, head: y * SIZE + x };
};

const isBitten = (snake: Snake) => snake.head === snake.neck || snake.head === snake.tail;

const getSnake = (state: SearchState): Snake => {
  const values = new Map(state.variables.map((variable) => [variable.name, variable.value]));
  return {
    head: Number(values.get("head")),
    neck: Number(values.get("neck")),
    tail: Number(values.get("tail")),
    direction:
      DIRECTIONS.find((found) => values.get("direction") === `"${found.name}"`) ?? START.direction,
  };
};

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
        role="img"
        aria-label="A snake on a board. The arrow keys steer it."
        className={cn("grid shrink-0 grid-cols-5 gap-1", hasBitten && "motion-safe:animate-shake")}
      >
        {Array.from({ length: SIZE * SIZE }, (_square, index) => (
          <span
            key={index}
            className={cn(
              "flex size-10 items-center justify-center rounded-md",
              index === shown.head
                ? hasBitten
                  ? "bg-destructive text-white"
                  : "bg-foreground text-background"
                : index === shown.neck
                  ? "bg-foreground/55"
                  : index === shown.tail
                    ? "bg-foreground/30"
                    : "bg-muted",
            )}
          >
            {index === shown.head && (
              <CaretUp weight="bold" className={cn("size-4", shown.direction.turn)} />
            )}
          </span>
        ))}
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
            "Rule: the snake never bites itself. It cannot turn straight back, so it should be safe. Steer with your arrow keys and make it bite anyway."
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
