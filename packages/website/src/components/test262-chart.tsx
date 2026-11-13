import { useState, type PointerEvent } from "react";
import { TextMorph } from "torph/react";
import { cn } from "cn";
import { getTest262Percent, TEST262_RUNS, TEST262_TOTAL } from "../test262";

const AXIS_MAX = 0.4;
const MORPH_MS = 300;
const TICKS = [0.4, 0.3, 0.2, 0.1, 0];
const LAST_INDEX = TEST262_RUNS.length - 1;

const getShare = (passed: number) => passed / TEST262_TOTAL;
const getX = (index: number) => (index / LAST_INDEX) * 100;
const getY = (passed: number) => 100 - (getShare(passed) / AXIS_MAX) * 100;

const LINE = TEST262_RUNS.map((run, index) => {
  if (index === 0) return `M0 ${getY(run.passed)}`;
  const middle = (getX(index - 1) + getX(index)) / 2;
  return `C${middle} ${getY(TEST262_RUNS[index - 1].passed)} ${middle} ${getY(run.passed)} ${getX(index)} ${getY(run.passed)}`;
}).join(" ");

const DATE_TICKS = TEST262_RUNS.flatMap((run, index) =>
  run.date === TEST262_RUNS[index - 1]?.date ? [] : [{ date: run.date, index }],
);

export const Test262Chart = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
  const activeIndex = hoveredIndex ?? LAST_INDEX;
  const active = TEST262_RUNS[activeIndex];
  const hover = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
    setHoveredIndex(Math.round(ratio * LAST_INDEX));
  };
  return (
    <figure className="flex flex-col gap-5">
      <figcaption className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-sm">
        <TextMorph
          as="span"
          duration={MORPH_MS}
          className="text-lg font-medium text-foreground tabular-nums"
        >
          {getTest262Percent(active.passed)}
        </TextMorph>
        <TextMorph as="span" duration={MORPH_MS} className="text-muted-foreground tabular-nums">
          {`(${active.passed.toLocaleString()} / ${TEST262_TOTAL.toLocaleString()} passing)`}
        </TextMorph>
        <TextMorph as="span" duration={MORPH_MS} className="ml-auto text-faint">
          {active.date}
        </TextMorph>
      </figcaption>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 text-xs text-faint tabular-nums">
        <div className="relative h-28 w-7">
          {TICKS.map((tick) => (
            <span
              key={tick}
              style={{ bottom: `${(tick / AXIS_MAX) * 100}%` }}
              className="absolute left-0 translate-y-1/2 leading-5"
            >
              {tick * 100}%
            </span>
          ))}
        </div>
        <div
          className="relative h-28 touch-pan-y"
          onPointerMove={hover}
          onPointerDown={hover}
          onPointerLeave={() => setHoveredIndex(undefined)}
        >
          {TICKS.map((tick) => (
            <div
              key={tick}
              style={{ bottom: `${(tick / AXIS_MAX) * 100}%` }}
              className={cn(
                "absolute inset-x-0 border-t",
                tick === 0 ? "border-input" : "border-muted",
              )}
            />
          ))}
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible text-foreground"
          >
            <defs>
              <linearGradient id="test262-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="currentColor" stopOpacity={0.12} />
                <stop offset="1" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={`${LINE} L100 100 L0 100 Z`} fill="url(#test262-area)" />
            <path
              d={LINE}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div
            style={{ left: `${getX(activeIndex)}%` }}
            className={cn(
              "absolute -inset-y-2 border-l border-foreground",
              hoveredIndex === undefined && "hidden",
            )}
          />
          <div
            style={{ left: `${getX(activeIndex)}%`, top: `${getY(active.passed)}%` }}
            className="absolute size-2 -translate-1/2 rounded-full bg-foreground ring-2 ring-background"
          />
        </div>
        <div className="relative col-start-2 mt-1 h-6">
          {DATE_TICKS.map((tick) => (
            <span
              key={tick.date}
              style={{ left: `${getX(tick.index)}%` }}
              className="absolute top-0 flex flex-col gap-1"
            >
              <span className="h-1.5 w-px bg-input" />
              <span
                className={cn("leading-5 whitespace-nowrap", tick.index > 0 && "-translate-x-1/2")}
              >
                {tick.date}
              </span>
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>test262 tests passing after each full run</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Passing</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          {TEST262_RUNS.map((run) => (
            <tr key={run.passed}>
              <td>{run.date}</td>
              <td>{run.passed.toLocaleString()}</td>
              <td>{getTest262Percent(run.passed)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};
