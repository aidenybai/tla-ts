import { Bug, Check } from "@phosphor-icons/react";
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
// How long the snake takes to cross to the next square, which is also how often a held key
// can step it.
const GLIDE_MS = 150;
// How long TLA-ts's replay spends on each state it tried, and how much of that the move takes.
const REPLAY_MS = 170;
const REPLAY_MOVE_MS = 120;
// The steps after which a reader who has not eaten the apple is shown how to find the bug.
const HINT_STEPS = 12;
const SHOWN_CALLS = 6;
const SNAKE_FILL = "fill-[oklch(58%_0.17_295)]";
const SHADE_FILL = "fill-[oklch(35%_0.08_140)]/25";
const SHADE_STROKE = "stroke-[oklch(35%_0.08_140)]/25";

// The board drawn again on each side of itself, so a snake that leaves by one edge is already
// coming in at the other.
const TILES = [-BOARD, 0, BOARD]
  .flatMap((x) => [-BOARD, 0, BOARD].map((y) => ({ x, y })))
  .filter((tile) => tile.x !== 0 || tile.y !== 0);

// The eight ways to move, clockwise from up, each an eighth of a turn from the last.
const DIRECTIONS = [
  { name: "up", move: [0, -1], key: "ArrowUp", glyph: "↑" },
  { name: "upRight", move: [1, -1], key: undefined, glyph: undefined },
  { name: "right", move: [1, 0], key: "ArrowRight", glyph: "→" },
  { name: "downRight", move: [1, 1], key: undefined, glyph: undefined },
  { name: "down", move: [0, 1], key: "ArrowDown", glyph: "↓" },
  { name: "downLeft", move: [-1, 1], key: undefined, glyph: undefined },
  { name: "left", move: [-1, 0], key: "ArrowLeft", glyph: "←" },
  { name: "upLeft", move: [-1, -1], key: undefined, glyph: undefined },
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

// The next square in the apple's round that the snake is not lying on.
const getNextApple = (body: number[]) => {
  let apple = body[0];
  while (body.includes(apple)) apple = (apple * 5 + 3) % (SIZE * SIZE);
  return apple;
};

const step = (snake: Snake): Snake => {
  const x = ((snake.body[0] % SIZE) + snake.direction.move[0] + SIZE) % SIZE;
  const y = (Math.floor(snake.body[0] / SIZE) + snake.direction.move[1] + SIZE) % SIZE;
  const head = y * SIZE + x;
  return head === snake.apple
    ? { ...snake, body: [head, ...snake.body], apple: getNextApple([head, ...snake.body]) }
    : { ...snake, body: [head, ...snake.body.slice(0, -1)] };
};

// The bug: the head is back on the square it just came from, which `turn` is there to stop.
const hasTurnedBack = (body: number[]) => body[0] === body[2];

// A long snake that runs into the rest of itself has only lost the game.
const hasCrashed = (body: number[]) => body.slice(1).includes(body[0]);

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

const GOALS = ["Move the snake", "Eat the apple", "Turn it straight back", "Let TLA-ts find it"];

interface Replay {
  search: Search;
  // The state of the search on the board. It is past the last one once every state has shown,
  // and below zero once the reader has taken the board back.
  index: number;
}

interface SnakeGameProps {
  // The search of the last run, whose states the board plays back in the order it tried them.
  search: Search | undefined;
  // Whether the board is out of sight behind another view, where no key moves it.
  isPaused: boolean;
  isRunning: boolean;
  onBugChange: (isFound: boolean) => void;
  // Shows the game's own code, as the reader wrote it or as TLA-ts checks it.
  onShowCode: (view: "typescript" | "tla") => void;
}

// The snake waits for the reader. An arrow key calls `turn` and the space bar calls `step`, the
// two functions of the example's code, so the reader makes by hand the calls TLA-ts tries.
export const SnakeGame = (props: SnakeGameProps) => {
  const [snake, setSnake] = useState(START);
  // The calls the reader has made, in the words of the code.
  const [calls, setCalls] = useState<string[]>([]);
  // The snake as it lies once a step has finished crossing to its square. The apple and the
  // end of a game are shown from it, so neither comes before the head does.
  const [settled, setSettled] = useState(START);
  const [heldKeys, setHeldKeys] = useState<ReadonlySet<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string>();
  const [replay, setReplay] = useState<Replay>();
  const isTouch = useMediaQuery("(hover: none) and (pointer: coarse)");
  const isReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  if (props.search && replay?.search !== props.search) {
    // A reader who asked for less motion sees where the search ended, not each state it tried.
    setReplay({ search: props.search, index: isReduced ? Infinity : 0 });
  }
  // A second run keeps the first one's states on the board until its own arrive.
  const search = props.search ?? replay?.search;
  // The states the search tried, with the one that breaks the rule last.
  const tried = useMemo(() => {
    const states = search?.checkedStates ?? [];
    return [
      ...states.filter((state) => !state.isFailing),
      ...states.filter((state) => state.isFailing),
    ];
  }, [search]);
  const isReplayShown = replay !== undefined && replay.index >= 0 && tried.length > 0;
  const isReplaying = isReplayShown && replay.index < tried.length;
  const active = isReplayShown
    ? ((isReplaying ? undefined : tried.find((state) => state.id === hoveredId)) ??
      tried[Math.min(replay.index, tried.length - 1)])
    : undefined;
  const shown = useMemo(() => (active ? getSnake(active) : snake), [active, snake]);
  const isSettled = settled.body === snake.body;
  const isOver = hasCrashed(snake.body);
  const hasBug = hasTurnedBack(shown.body) && (isReplayShown ? !isReplaying : isOver && isSettled);
  const isLost = isOver && isSettled && !isReplayShown && !hasTurnedBack(snake.body);
  const boardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(boardRef, { amount: 0.5 });

  const snakeId = useId();
  const backId = useId();
  const backRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const lastBodyRef = useRef(START.body);
  const draw = (points: Point[]) => {
    backRef.current?.setAttribute("d", getPath(points));
    headRef.current?.setAttribute("transform", `translate(${points[0].x} ${points[0].y})`);
  };
  // A step glides to its square. Each frame is written to the drawing itself, so sixty frames
  // a second render nothing.
  useLayoutEffect(() => {
    const from = lastBodyRef.current;
    if (from === shown.body) return;
    lastBodyRef.current = shown.body;
    const arrive = () => {
      if (isReplayShown) return;
      setSettled(shown);
      if (hasCrashed(shown.body)) props.onBugChange(hasTurnedBack(shown.body));
    };
    if (isReplayShown || isReduced || shown.body[1] !== from[0]) {
      draw(getBack(shown.body));
      return arrive();
    }
    const start = performance.now();
    draw(getPose(from, shown.body, 0));
    let frame = requestAnimationFrame(function glide(now) {
      const progress = Math.max(0, (now - start) / GLIDE_MS);
      draw(getPose(from, shown.body, progress));
      if (progress < 1) frame = requestAnimationFrame(glide);
      else arrive();
    });
    return () => cancelAnimationFrame(frame);
  }, [shown, isReplayShown, isReduced]);
  // The replay plays each state as the move that reached it: the snake is put where that move
  // began and makes it, faster than a reader would.
  useEffect(() => {
    if (!isReplaying) return;
    const snakes = new Map(tried.map((state) => [state.id, getSnake(state)]));
    const start = performance.now();
    let frame = requestAnimationFrame(function play(now) {
      const index = Math.floor((now - start) / REPLAY_MS);
      setReplay((current) =>
        current && current.index !== index ? { ...current, index } : current,
      );
      if (index >= tried.length) return;
      frame = requestAnimationFrame(play);
      const state = tried[index];
      draw(
        getPose(
          snakes.get(state.parentId ?? "")?.body,
          snakes.get(state.id)?.body ?? START.body,
          ((now - start) % REPLAY_MS) / REPLAY_MOVE_MS,
        ),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [isReplaying, tried]);

  // A key after the end of a game, or after TLA-ts has had the board, starts a new game.
  const isFresh = isReplayShown || isOver;
  const restart = (first: Snake, firstCalls: string[]) => {
    setReplay(replay && { ...replay, index: -1 });
    setSnake(first);
    setCalls(firstCalls);
    props.onBugChange(false);
  };
  const callTurn = (next: Direction) => {
    if (isReplaying) return;
    const call = `turn("${next.name}")`;
    if (isFresh) return restart(turn(START, next), [call]);
    setSnake((current) => turn(current, next));
    setCalls((made) => [...made, call]);
  };
  const callStep = () => {
    if (isReplaying) return;
    if (isFresh) return restart(START, []);
    // A step waits for the last one to arrive, so a held key moves the snake at its own pace.
    if (!isSettled) return;
    setSnake(step);
    setCalls((made) => [...made, "step"]);
  };
  // The keys work while the board is on screen, from wherever the focus is in the card, and
  // go back to the page once it is not.
  useEffect(() => {
    if (!isInView || props.isPaused) return;
    const handleKey = (event: KeyboardEvent) => {
      const found = DIRECTIONS.find((item) => item.key === event.key);
      if ((!found && event.key !== " ") || event.metaKey || event.ctrlKey || event.altKey) return;
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.closest("input, textarea, select")) return;
      // The space bar still presses a button or follows a link outside the example's card.
      if (
        event.key === " " &&
        event.target.closest("button, a") &&
        !event.target.closest("[data-example]")
      )
        return;
      event.preventDefault();
      setHeldKeys((held) => new Set(held).add(event.key));
      if (found && !event.repeat) callTurn(found);
      if (!found) callStep();
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
  const steps = search?.states.flatMap((state) => state.call ?? []) ?? [];
  const stepCount = calls.filter((call) => call === "step").length;
  const hasEaten = snake.body.length > START.body.length;
  // The goal the reader is on: move, eat, turn back, then hand over to TLA-ts.
  const stage =
    hasBug || props.isRunning
      ? 3
      : stepCount === 0
        ? 0
        : hasEaten || stepCount >= HINT_STEPS
          ? 2
          : 1;
  const heading = DIRECTIONS.indexOf(snake.direction);
  // The two keys that turn a snake heading straight back on itself: a quarter turn, then on
  // to the way it came from.
  const recipe =
    heading % 2 === 0
      ? ([DIRECTIONS[(heading + 6) % 8], DIRECTIONS[(heading + 4) % 8]] as const)
      : undefined;
  const shownApple = getCenter(isReplayShown ? shown.apple : settled.apple);
  const space = <KeyCap isLit={heldKeys.has(" ")}>Space</KeyCap>;
  return (
    <div className="flex w-full flex-wrap gap-x-7 gap-y-6 pt-1 pb-4">
      <div
        ref={boardRef}
        // A click turns the snake to the eighth of a turn nearest to it.
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const head = getCenter(snake.body[0]);
          const angle = Math.atan2(
            ((event.clientX - box.left) / box.width) * BOARD - head.x,
            head.y - ((event.clientY - box.top) / box.width) * BOARD,
          );
          callTurn(DIRECTIONS[(Math.round(angle / (Math.PI / 4)) + 8) % 8]);
        }}
        className={cn(
          "mb-1 w-full max-w-[352px] shrink-0 cursor-pointer touch-manipulation self-start overflow-hidden rounded-lg shadow-[0_4px_0_oklch(80%_0.08_140)] select-none dark:shadow-[0_4px_0_oklch(22%_0.04_140)]",
          (hasBug || isLost) && "motion-safe:animate-shake",
        )}
      >
        <svg
          role="img"
          aria-label="A snake and an apple on a board. The arrow keys steer the snake, and so does a click on the board."
          viewBox={`0 0 ${BOARD} ${BOARD}`}
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
          <g transform={`translate(${shownApple.x} ${shownApple.y})`}>
            <g
              key={`${shownApple.x} ${shownApple.y}`}
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
          <g id={snakeId}>
            <use href={`#${backId}`} y={1.3} strokeWidth={6.6} className={SHADE_STROKE} />
            <use
              href={`#${backId}`}
              strokeWidth={6.6}
              className={cn(
                hasBug ? "stroke-destructive" : "stroke-[oklch(58%_0.17_295)]",
                isLost && "opacity-50",
              )}
            />
            <use href={`#${backId}`} y={-1.2} strokeWidth={1.8} className="stroke-white/25" />
            <g ref={headRef} transform={`translate(${START_BACK[0].x} ${START_BACK[0].y})`}>
              <circle cy={1.3} r={4} className={SHADE_FILL} />
              <circle r={4} className={hasBug ? "fill-destructive" : SNAKE_FILL} />
              <circle cx={-0.6} cy={-1.4} r={2.2} className="fill-white/15" />
              <g transform={`rotate(${DIRECTIONS.indexOf(shown.direction) * 45})`}>
                <circle cx={-1.9} cy={-1.6} r={1.5} className="fill-white" />
                <circle cx={1.9} cy={-1.6} r={1.5} className="fill-white" />
                <circle cx={-1.9} cy={-2.1} r={0.75} className="fill-[oklch(25%_0.05_295)]" />
                <circle cx={1.9} cy={-2.1} r={0.75} className="fill-[oklch(25%_0.05_295)]" />
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
      <div className="flex min-h-28 min-w-52 flex-1 flex-col gap-3 self-stretch sm:min-h-44">
        {isReplayShown ? (
          <>
            {/* The tree comes first, so the lines under it can grow without moving it. */}
            <SearchTree
              states={tried}
              triedCount={replay.index + 1}
              activeId={active?.id}
              onHover={setHoveredId}
            />
            <p
              aria-live="polite"
              className="text-sm text-pretty text-muted-foreground tabular-nums"
            >
              {props.isRunning ? (
                "TLA-ts is trying every order of calls the code allows."
              ) : isReplaying ? (
                `TLA-ts is trying state ${Math.min(replay.index + 1, tried.length)} of ${tried.length}.`
              ) : (
                <>
                  TLA-ts turned the game&rsquo;s{" "}
                  <Button
                    variant="link"
                    size="inline"
                    onClick={() => props.onShowCode("typescript")}
                  >
                    TypeScript
                  </Button>{" "}
                  into{" "}
                  <Button variant="link" size="inline" onClick={() => props.onShowCode("tla")}>
                    TLA+
                  </Button>
                  , tried {tried.length} states, and found the same calls:
                </>
              )}
            </p>
            {!isReplaying && !props.isRunning && <Calls calls={steps} isBroken />}
          </>
        ) : (
          <>
            <ol className="flex flex-col gap-2.5">
              {GOALS.map((goal, index) => {
                // A goal the reader went past without reaching is left unticked.
                const isDone = index < stage && [stepCount > 0, hasEaten, hasBug][index];
                const isCurrent = index === stage;
                const isBug = index === 2 && hasBug;
                return (
                  <li key={goal} className="flex gap-2.5">
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs tabular-nums transition-colors duration-200 ease-out",
                        isBug
                          ? "bg-destructive/15 text-destructive"
                          : isDone
                            ? "bg-success/15 text-success"
                            : isCurrent
                              ? "bg-foreground text-background"
                              : "bg-muted text-faint",
                      )}
                    >
                      {isBug ? (
                        <Bug weight="fill" className="size-3" />
                      ) : isDone ? (
                        <Check weight="bold" className="size-3" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span
                      className={cn(
                        "transition-colors duration-200 ease-out",
                        isBug ? "text-destructive" : isCurrent ? "text-foreground" : "text-faint",
                      )}
                    >
                      {isBug ? "Bug: it turned back" : goal}
                    </span>
                  </li>
                );
              })}
            </ol>
            {/* The help for the goal in hand has its own place under the list, tall enough for the
                longest of it, so that moving on to the next goal moves no goal. */}
            <div className="min-h-[4.5rem]">
              <p
                key={stage}
                aria-live="polite"
                className="text-sm text-pretty text-muted-foreground motion-safe:animate-chip-in"
              >
                {stage === 0 &&
                  (isTouch ? (
                    "It waits for you. Press Step to move it one square."
                  ) : (
                    <>It waits for you. Press {space} to move it one square.</>
                  ))}
                {stage === 1 &&
                  (isTouch ? (
                    "Tap the board to turn it, and press Step to move."
                  ) : (
                    <>
                      Turn with <KeyCap isLit={heldKeys.has("ArrowLeft")}>←</KeyCap>
                      <KeyCap isLit={heldKeys.has("ArrowUp")}>↑</KeyCap>
                      <KeyCap isLit={heldKeys.has("ArrowDown")}>↓</KeyCap>
                      <KeyCap isLit={heldKeys.has("ArrowRight")}>→</KeyCap> and move with {space}.
                    </>
                  ))}
                {stage === 2 &&
                  (isLost ? (
                    `It ran into itself. That is allowed, so it is not the bug. ${isTouch ? "Tap" : "Press a key"} to play again.`
                  ) : isTouch ? (
                    "It cannot turn back in one turn. Tap beside it, tap behind it, then press Step."
                  ) : recipe ? (
                    <>
                      One turn cannot do it. Two can: press{" "}
                      <KeyCap isLit={heldKeys.has(recipe[0].key ?? "")}>{recipe[0].glyph}</KeyCap>,{" "}
                      <KeyCap isLit={heldKeys.has(recipe[1].key ?? "")}>{recipe[1].glyph}</KeyCap>,
                      then {space}.
                    </>
                  ) : (
                    "One turn cannot do it. Straighten the snake with an arrow key first."
                  ))}
                {stage === 3 &&
                  (props.isRunning
                    ? "TLA-ts is trying every order of calls the code allows."
                    : "Three calls broke it. Press run, and TLA-ts finds them without being told.")}
              </p>
            </div>
            <Calls calls={calls} isBroken={hasBug} />
          </>
        )}
        <div className="mt-auto flex items-center gap-4">
          {!isReplayShown && (
            <Button disabled={hasBug} onClick={callStep} className="pr-1.5 text-foreground">
              Step
              <kbd className="rounded-sm bg-muted px-1 py-0.5 font-sans text-xs text-muted-foreground max-sm:hidden pointer-coarse:hidden">
                Space
              </kbd>
            </Button>
          )}
          {(calls.length > 0 || isReplayShown) && !isReplaying && (
            <Button
              variant="link"
              size="inline"
              onClick={() => restart(START, [])}
              className="text-sm"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

interface CallsProps {
  calls: string[];
  isBroken: boolean;
}

// The calls made to the game's two functions, newest last. The reader's and TLA-ts's are set
// the same way, so that one reads as the other.
const Calls = (props: CallsProps) => (
  <ol
    aria-label="Calls"
    className="flex min-h-[3.25rem] flex-wrap content-start gap-1 font-mono text-xs"
  >
    {props.calls.length > SHOWN_CALLS && <li className="px-0.5 py-0.5 text-faint">...</li>}
    {props.calls
      .map((call, index) => ({ call, order: index }))
      .slice(-SHOWN_CALLS)
      .map((item, index, shownCalls) => (
        <li
          key={item.order}
          className={cn(
            "rounded-md border px-1.5 py-0.5 motion-safe:animate-chip-in",
            props.isBroken && index >= shownCalls.length - 3
              ? "border-transparent bg-destructive/15 text-destructive"
              : "text-foreground",
          )}
        >
          {item.call}
        </li>
      ))}
  </ol>
);
