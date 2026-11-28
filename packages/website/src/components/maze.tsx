import { Bug, Check } from "@phosphor-icons/react";
import { useInView } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "cn";
import type { Search } from "@/lib/search";
import { Button } from "@/components/ui/button";
import { KeyCap } from "@/components/ui/key-cap";
import { useMediaQuery } from "@/hooks/use-media-query";

// The board of the example's code, and its two moves, with the mistake in `dash`.
const MAP = [".......", ".......", "..###..", "..#$#..", "..###..", ".......", "......."];
const SIZE = MAP.length;
const START = { x: 0, y: 6 };
const GOLD = { x: 3, y: 3 };
// How long TLA-ts's flood takes to reach each next square.
const FLOOD_MS = 70;
// The calls after which a reader who has not found the way in is told where to look.
const HINT_CALLS = 10;
const SHOWN_CALLS = 6;
const CELL = 10;
const BOARD = SIZE * CELL;
const CORNER = 5;

const DIRECTIONS = [
  { name: "up", move: [0, -1], key: "ArrowUp", glyph: "↑", angle: 0 },
  { name: "right", move: [1, 0], key: "ArrowRight", glyph: "→", angle: 90 },
  { name: "down", move: [0, 1], key: "ArrowDown", glyph: "↓", angle: 180 },
  { name: "left", move: [-1, 0], key: "ArrowLeft", glyph: "←", angle: 270 },
] as const;

type Direction = (typeof DIRECTIONS)[number];

interface Square {
  x: number;
  y: number;
}

// Both moves go through here, as they do in the code. Only the square the player lands on is
// looked at, so a dash goes over a wall.
const go = (from: Square, direction: Direction, squares: number): Square => {
  const next = {
    x: from.x + direction.move[0] * squares,
    y: from.y + direction.move[1] * squares,
  };
  const square = MAP[next.y]?.[next.x];
  return square === undefined || square === "#" ? from : next;
};

const isSame = (first: Square, second: Square) => first.x === second.x && first.y === second.y;

const getKey = (square: Square) => `${square.x} ${square.y}`;

const SQUARES = MAP.flatMap((row, y) => [...row].map((kind, x) => ({ x, y, kind })));

// The lines between the squares, as places across the board.
const LINES = Array.from({ length: SIZE - 1 }, (_line, index) => (index + 1) * CELL);

const getPoints = (squares: Square[]) =>
  squares.map((square) => `${square.x * CELL + CELL / 2},${square.y * CELL + CELL / 2}`).join(" ");

const GOALS = ["Move around", "Reach the gold", "Let TLA-ts find the way"];

interface MazeProps {
  // The search of the last run, whose squares the board fills in the order it reached them.
  search: Search | undefined;
  // Whether the board is out of sight behind another view, where no key moves the player.
  isPaused: boolean;
  isRunning: boolean;
  onBugChange: (isFound: boolean) => void;
  // Shows the game's own code, as the reader wrote it or as TLA-ts checks it.
  onShowCode: (view: "typescript" | "tla") => void;
}

// Each square of the board is one state of the game's code, so the reader walks the states
// TLA-ts checks. An arrow key calls `move` and one with the shift key calls `dash`.
export const Maze = (props: MazeProps) => {
  const [player, setPlayer] = useState(START);
  const [facing, setFacing] = useState<Direction>(DIRECTIONS[0]);
  // The squares the reader has stood on, in order, which the board draws as their way.
  const [trail, setTrail] = useState<Square[]>([START]);
  const clipId = useId();
  // The calls the reader has made, in the words of the code.
  const [calls, setCalls] = useState<string[]>([]);
  const [heldKeys, setHeldKeys] = useState<ReadonlySet<string>>(new Set());
  // The search on the board, and whether its flood has reached its last square.
  const [flood, setFlood] = useState<{ search: Search; isDone: boolean }>();
  const [isFloodHidden, setIsFloodHidden] = useState(false);
  const isTouch = useMediaQuery("(hover: none) and (pointer: coarse)");
  const isReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  if (props.search && flood?.search !== props.search) {
    setFlood({ search: props.search, isDone: isReduced });
    setIsFloodHidden(false);
    // The player goes back to the start, where the search begins, and off the gold.
    setPlayer(START);
    setTrail([START]);
  }
  // A second run keeps the first one's flood on the board until its own arrives.
  const search = isFloodHidden ? undefined : flood?.search;
  // The squares the search reached, in the order it reached them, with the gold last.
  const reached = useMemo(() => {
    const states = search?.checkedStates ?? [];
    return [
      ...states.filter((state) => !state.isFailing),
      ...states.filter((state) => state.isFailing),
    ].map((state) => {
      const values = new Map(state.variables.map((variable) => [variable.name, variable.value]));
      return { x: Number(values.get("x")), y: Number(values.get("y")), isFailing: state.isFailing };
    });
  }, [search]);
  const isFlooding = search !== undefined && flood?.isDone === false;
  const floodMs = reached.length * FLOOD_MS;
  useEffect(() => {
    if (!isFlooding) return;
    const timer = setTimeout(
      () => setFlood((current) => current && { ...current, isDone: true }),
      floodMs + 300,
    );
    return () => clearTimeout(timer);
  }, [isFlooding, floodMs]);
  const hasBug = isSame(player, GOLD);
  const boardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(boardRef, { amount: 0.5 });

  const restart = () => {
    setPlayer(START);
    setTrail([START]);
    setFacing(DIRECTIONS[0]);
    setCalls([]);
    setIsFloodHidden(true);
    props.onBugChange(false);
  };
  const call = (direction: Direction, squares: number) => {
    if (isFlooding) return;
    // A move after the gold is reached, or after TLA-ts has had the board, starts a new game.
    const from = hasBug || search !== undefined ? START : player;
    const next = go(from, direction, squares);
    setPlayer(next);
    setTrail(from === player ? (next === from ? trail : [...trail, next]) : [START, next]);
    setFacing(direction);
    setIsFloodHidden(true);
    const made = `${squares === 1 ? "move" : "dash"}("${direction.name}")`;
    setCalls(from === player ? [...calls, made] : [made]);
    props.onBugChange(isSame(next, GOLD));
  };
  // The keys work while the board is on screen, from wherever the focus is, and scroll the
  // page again once it is not.
  useEffect(() => {
    if (!isInView || props.isPaused) return;
    const handleKey = (event: KeyboardEvent) => {
      const found = DIRECTIONS.find((item) => item.key === event.key);
      if (event.key === "Shift") setHeldKeys((held) => new Set(held).add("Shift"));
      if (!found || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select"))
        return;
      event.preventDefault();
      setHeldKeys((held) => new Set(held).add(event.key));
      call(found, event.shiftKey ? 2 : 1);
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
  const path = search?.states.map((state) => {
    const values = new Map(state.variables.map((variable) => [variable.name, variable.value]));
    return { x: Number(values.get("x")), y: Number(values.get("y")) };
  });
  // The goal the reader is on: move, reach the gold, then hand over to TLA-ts.
  const stage = hasBug || props.isRunning ? 2 : calls.length === 0 ? 0 : 1;
  const shift = <KeyCap isLit={heldKeys.has("Shift")}>Shift</KeyCap>;
  const arrows = DIRECTIONS.map((direction) => (
    <KeyCap key={direction.name} isLit={heldKeys.has(direction.key)}>
      {direction.glyph}
    </KeyCap>
  ));
  return (
    <div className="flex w-full flex-wrap gap-x-7 gap-y-6 pt-1 pb-4">
      <div
        ref={boardRef}
        className={cn(
          "relative w-full max-w-[352px] shrink-0 touch-manipulation self-start select-none",
          hasBug && search === undefined && "motion-safe:animate-shake",
        )}
      >
        <svg
          role="img"
          aria-label="A maze with a player in one corner and gold walled in at its middle. The arrow keys move the player."
          viewBox={`-1 -1 ${BOARD + 2} ${BOARD + 2}`}
          className="block w-full"
        >
          <defs>
            <clipPath id={clipId}>
              <rect width={BOARD} height={BOARD} rx={CORNER} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            {SQUARES.map((square) => {
              const order = reached.findIndex((found) => isSame(found, square));
              const distance = Math.abs(square.x - player.x) + Math.abs(square.y - player.y);
              return (
                <g key={getKey(square)}>
                  <rect
                    x={square.x * CELL}
                    y={square.y * CELL}
                    width={CELL}
                    height={CELL}
                    // A click on a square in line with the player moves there, or dashes there.
                    onClick={() => {
                      const direction = DIRECTIONS.find(
                        (found) =>
                          Math.sign(square.x - player.x) === found.move[0] &&
                          Math.sign(square.y - player.y) === found.move[1],
                      );
                      if (direction && (distance === 1 || distance === 2))
                        call(direction, distance);
                    }}
                    className={cn(
                      "cursor-pointer",
                      square.kind === "#" ? "fill-foreground/85" : "fill-background",
                    )}
                  />
                  {order >= 0 && (
                    <rect
                      x={square.x * CELL}
                      y={square.y * CELL}
                      width={CELL}
                      height={CELL}
                      style={{ animationDelay: `${order * FLOOD_MS}ms` }}
                      className={cn(
                        "pointer-events-none motion-safe:animate-line-in",
                        reached[order].isFailing ? "fill-destructive/25" : "fill-success/20",
                      )}
                    />
                  )}
                </g>
              );
            })}
            {LINES.map((line) => (
              <path
                key={line}
                d={`M${line} 0V${BOARD}M0 ${line}H${BOARD}`}
                strokeWidth={0.5}
                className="pointer-events-none stroke-input"
              />
            ))}
          </g>
          <rect
            width={BOARD}
            height={BOARD}
            rx={CORNER}
            fill="none"
            strokeWidth={0.7}
            className="pointer-events-none stroke-faint"
          />
          <g
            fill="none"
            strokeWidth={6.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none"
          >
            {/* The reader's own way across the board, and then the way TLA-ts found. */}
            {search === undefined ? (
              <polyline
                points={getPoints(trail)}
                className={cn(
                  "transition-colors duration-200 ease-out",
                  hasBug ? "stroke-destructive/55" : "stroke-success/55",
                )}
              />
            ) : (
              path &&
              flood?.isDone && (
                <polyline
                  points={getPoints(path)}
                  className="stroke-destructive/55 motion-safe:animate-line-in"
                />
              )
            )}
          </g>
          <g
            transform={`translate(${GOLD.x * CELL + CELL / 2} ${GOLD.y * CELL + CELL / 2})`}
            className="pointer-events-none"
          >
            <circle r={3.3} className="fill-[oklch(80%_0.16_88)]" />
            <circle
              r={2.1}
              fill="none"
              strokeWidth={0.55}
              className="stroke-[oklch(62%_0.14_78)]"
            />
          </g>
          <g
            style={{
              translate: `${player.x * CELL + CELL / 2}px ${player.y * CELL + CELL / 2}px`,
            }}
            className="pointer-events-none transition-[translate] duration-150 ease-out motion-reduce:transition-none"
          >
            <circle
              r={3.5}
              className={cn(
                "transition-colors duration-200 ease-out",
                hasBug && search === undefined ? "fill-destructive" : "fill-foreground",
              )}
            />
            <g
              style={{ translate: `${facing.move[0] * 0.8}px ${facing.move[1] * 0.8}px` }}
              className="fill-background transition-[translate] duration-150 ease-out"
            >
              <circle cx={-1.25} r={0.75} />
              <circle cx={1.25} r={0.75} />
            </g>
          </g>
        </svg>
        {hasBug && search === undefined && (
          <p className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-sm whitespace-nowrap text-white shadow-raised motion-safe:animate-drop-in">
            <Bug weight="fill" className="size-3.5" />
            Bug found · It dashed through a wall
          </p>
        )}
      </div>
      {/* The column keeps the board's height, with its link at the foot, so that a longer line
          moves nothing. */}
      <div className="flex min-h-28 min-w-52 flex-1 flex-col gap-3 self-stretch sm:min-h-44">
        <ol className="flex flex-col gap-2.5">
          {GOALS.map((goal, index) => {
            const isCurrent = index === stage && search === undefined;
            const isBug = index === 1 && (hasBug || search !== undefined);
            const isDone =
              index === 0
                ? calls.length > 0 || search !== undefined
                : index === 2 && flood?.isDone === true && search !== undefined;
            return (
              <li key={goal} className="flex gap-2.5">
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs tabular-nums transition-colors duration-200 ease-out",
                    isBug
                      ? "bg-destructive/15 text-destructive"
                      : isDone
                        ? "bg-success/15 text-success"
                        : isCurrent || (index === 2 && search !== undefined)
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
                    isBug
                      ? "text-destructive"
                      : isCurrent || (index === 2 && search !== undefined)
                        ? "text-foreground"
                        : "text-faint",
                  )}
                >
                  {goal}
                </span>
              </li>
            );
          })}
        </ol>
        {/* The help for the goal in hand has its own place under the list, tall enough for the
            longest of it, so that moving on to the next goal moves no goal. */}
        <div className="min-h-[5.5rem]">
          <p
            key={search === undefined ? stage : "flood"}
            aria-live="polite"
            className="text-sm text-pretty text-muted-foreground motion-safe:animate-chip-in"
          >
            {props.isRunning ? (
              "TLA-ts is trying every square the code can reach."
            ) : search !== undefined ? (
              flood?.isDone ? (
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
                  , tried {reached.length} squares, and reached the gold:
                </>
              ) : (
                "TLA-ts is trying every square the code can reach."
              )
            ) : stage === 0 ? (
              isTouch ? (
                "Tap a square next to the player to move there."
              ) : (
                <>Press {arrows} to move one square.</>
              )
            ) : stage === 1 ? (
              calls.length < HINT_CALLS ? (
                isTouch ? (
                  "Walls close the gold in. Tap two squares away to dash. Find a way in."
                ) : (
                  <>
                    Walls close the gold in. Hold {shift} with an arrow to dash two squares. Find a
                    way in.
                  </>
                )
              ) : (
                "Hint: a dash only looks at the square it lands on."
              )
            ) : (
              "A dash never looked at the wall. Press run, and TLA-ts finds that without being told."
            )}
          </p>
        </div>
        <ol
          aria-label="Calls"
          className="flex min-h-[3.25rem] flex-wrap content-start gap-1 font-mono text-xs"
        >
          {(search !== undefined && flood?.isDone ? steps : search !== undefined ? [] : calls)
            .map((made, index) => ({ made, order: index }))
            .slice(-SHOWN_CALLS)
            .map((item) => (
              <li
                key={item.order}
                className={cn(
                  "rounded-md border px-1.5 py-0.5 motion-safe:animate-chip-in",
                  search !== undefined || hasBug
                    ? "border-transparent bg-destructive/15 text-destructive"
                    : "text-foreground",
                )}
              >
                {item.made}
              </li>
            ))}
        </ol>
        {(calls.length > 0 || search !== undefined) && !isFlooding && (
          <Button
            variant="link"
            size="inline"
            onClick={restart}
            className="mt-auto self-start text-sm"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};
