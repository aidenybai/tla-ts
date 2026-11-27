import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Coins } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { cn } from "cn";
import type { Search } from "@/lib/search";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";

// The board of the example's code, and its four moves, with the mistake in `left`.
const SIZE = 5;
const WALLS = new Set(["3,0", "4,1", "1,1", "1,2", "3,3", "2,3"]);
const START = "0,4";
const GOLD = "4,0";
const CHECK_DELAY_MS = 70;

const MOVES = [
  { name: "up", icon: ArrowUp, key: "ArrowUp", area: "[grid-area:1/2]" },
  { name: "left", icon: ArrowLeft, key: "ArrowLeft", area: "[grid-area:2/1]" },
  { name: "down", icon: ArrowDown, key: "ArrowDown", area: "[grid-area:2/2]" },
  { name: "right", icon: ArrowRight, key: "ArrowRight", area: "[grid-area:2/3]" },
] as const;

type MoveName = (typeof MOVES)[number]["name"];

const getNext = (square: string, move: MoveName) => {
  const [x, y] = square.split(",").map(Number);
  const next = {
    up: `${x},${Math.max(y - 1, 0)}`,
    down: `${x},${Math.min(y + 1, SIZE - 1)}`,
    right: `${Math.min(x + 1, SIZE - 1)},${y}`,
    left: `${(x + SIZE - 1) % SIZE},${y}`,
  }[move];
  return WALLS.has(next) ? square : next;
};

const SQUARES = Array.from({ length: SIZE * SIZE }, (_square, index) => {
  const x = index % SIZE;
  return `${x},${(index - x) / SIZE}`;
});

interface MazeProps {
  // The search of the last run, whose squares the board ticks off in the order it tried them.
  search: Search | undefined;
  isRunning: boolean;
  onRun: () => void;
}

export const Maze = (props: MazeProps) => {
  const [squares, setSquares] = useState([START]);
  const square = squares[squares.length - 1];
  const isRobbed = square === GOLD;
  const move = (name: MoveName) => {
    if (!isRobbed) setSquares([...squares, getNext(square, name)]);
  };
  const checked = useMemo(
    () =>
      (props.search?.checkedStates ?? []).map((state) => ({
        square: `${state.variables.find((variable) => variable.name === "x")?.value},${state.variables.find((variable) => variable.name === "y")?.value}`,
        isFailing: state.isFailing,
      })),
    [props.search],
  );
  const steps = props.search?.states.flatMap((state) => state.call ?? []) ?? [];
  const tried = new Set(squares);
  return (
    <div className="my-2 flex flex-wrap items-start gap-x-8 gap-y-5 rounded-[18px] bg-card p-4 shadow-raised">
      <div
        role="application"
        aria-label="Maze. Use the arrow keys to move."
        tabIndex={0}
        onKeyDown={(event) => {
          const found = MOVES.find((item) => item.key === event.key);
          if (!found) return;
          event.preventDefault();
          move(found.name);
        }}
        className="grid shrink-0 grid-cols-5 gap-1 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {SQUARES.map((item) => {
          const order = checked.findIndex((found) => found.square === item);
          return (
            <span
              key={item}
              style={{ animationDelay: `${order * CHECK_DELAY_MS + 200}ms` }}
              className={cn(
                "relative flex size-10 items-center justify-center rounded-md",
                WALLS.has(item) ? "bg-foreground/80" : "bg-muted",
                item === GOLD &&
                  (isRobbed || checked[order]?.isFailing) &&
                  "bg-destructive/15 motion-safe:animate-shake",
              )}
            >
              {item === GOLD && item !== square && (
                <Coins weight="fill" className="size-5 text-[oklch(70%_0.14_85)]" />
              )}
              {item === square && (
                <span className="flex scale-125 text-foreground">
                  <Logo />
                </span>
              )}
              {item !== square && item !== GOLD && tried.has(item) && (
                <span className="size-1.5 rounded-full bg-foreground/25" />
              )}
              {order >= 0 && !checked[order].isFailing && (
                <span
                  style={{ animationDelay: `${order * CHECK_DELAY_MS}ms` }}
                  className="absolute inset-0 rounded-md bg-success/15 motion-safe:animate-chip-in"
                />
              )}
              {order >= 0 && (
                <Check
                  weight="bold"
                  style={{ animationDelay: `${order * CHECK_DELAY_MS}ms` }}
                  className={cn(
                    "absolute top-0.5 right-0.5 size-2.5 motion-safe:animate-chip-in",
                    checked[order].isFailing ? "text-destructive" : "text-success",
                  )}
                />
              )}
            </span>
          );
        })}
      </div>
      <div className="flex min-w-48 flex-1 flex-col items-start gap-4">
        <p aria-live="polite" className="text-sm text-pretty text-muted-foreground">
          {checked.length > 0 ? (
            <>
              TLA-ts tried {checked.length} squares and reached the gold in {steps.length} moves:{" "}
              <span className="text-foreground">{steps.join(", ")}</span>.
            </>
          ) : isRobbed ? (
            `You reached the gold in ${squares.length - 1} moves.`
          ) : (
            "Rule: nobody reaches the gold. Walls close it off. Try to get there anyway."
          )}
        </p>
        <div className="grid grid-cols-3 gap-1">
          {MOVES.map((item) => (
            <Button
              key={item.name}
              size="icon"
              aria-label={`Move ${item.name}`}
              disabled={isRobbed}
              onClick={() => move(item.name)}
              className={item.area}
            >
              <item.icon />
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-faint">
          <Button variant="success" disabled={props.isRunning} onClick={props.onRun}>
            {props.isRunning ? "Trying every path" : "Let TLA-ts try"}
          </Button>
          <span className="tabular-nums">
            You tried {tried.size} {tried.size === 1 ? "square" : "squares"}
          </span>
          {squares.length > 1 && (
            <Button variant="link" size="inline" onClick={() => setSquares([START])}>
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
