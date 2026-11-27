import { useState, type PointerEvent } from "react";
import { cn } from "cn";
import { getTest262Percent, getTest262Share, TEST262_RUNS } from "@/lib/test262";

const TICK_PERCENT = 20;
const LAST_INDEX = TEST262_RUNS.length - 1;
const AXIS_PERCENT =
  Math.ceil((Math.max(...TEST262_RUNS.map(getTest262Share)) * 100) / TICK_PERCENT) * TICK_PERCENT;
const TICKS = [...Array(AXIS_PERCENT / TICK_PERCENT + 1).keys()].map(
  (index) => AXIS_PERCENT - index * TICK_PERCENT,
);

const getX = (index: number) => (index / LAST_INDEX) * 100;
const getY = (run: (typeof TEST262_RUNS)[number]) =>
  100 - ((getTest262Share(run) * 100) / AXIS_PERCENT) * 100;

const LINE = TEST262_RUNS.map((run, index) => {
  if (index === 0) return `M0 ${getY(run)}`;
  const middle = (getX(index - 1) + getX(index)) / 2;
  return `C${middle} ${getY(TEST262_RUNS[index - 1])} ${middle} ${getY(run)} ${getX(index)} ${getY(run)}`;
}).join(" ");

// The least room between two dates' ticks, as a share of the chart's width, where it is wide and
// where it is a phone's.
const WIDE_GAP_PERCENT = 13;
const NARROW_GAP_PERCENT = 26;

// The dates whose labels fit: the latest, then each earlier one that is far enough from the one
// kept after it.
const getSpacedLabels = (ticks: { label: string; index: number }[], gapPercent: number) =>
  ticks.reduceRight<{ label: string; index: number }[]>(
    (kept, tick) =>
      kept.length === 0 || getX(kept[0].index) - getX(tick.index) >= gapPercent
        ? [tick, ...kept]
        : kept,
    [],
  );

const FIRST_OF_DATES = TEST262_RUNS.flatMap((run, index) =>
  run.label === TEST262_RUNS[index - 1]?.label ? [] : [{ label: run.label, index }],
);
const NARROW_LABELS = new Set(
  getSpacedLabels(FIRST_OF_DATES, NARROW_GAP_PERCENT).map((tick) => tick.label),
);
const DATE_TICKS = getSpacedLabels(FIRST_OF_DATES, WIDE_GAP_PERCENT).map((tick) => ({
  ...tick,
  isTight: !NARROW_LABELS.has(tick.label),
}));

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
        <span className="text-lg font-medium text-foreground tabular-nums">
          {getTest262Percent(active)}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {`(${active.passed.toLocaleString()} / ${active.total.toLocaleString()} passing)`}
        </span>
        <span className="ml-auto text-faint">{active.label}</span>
      </figcaption>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 font-pixel text-[11px] text-faint uppercase">
        <div className="relative h-28 w-7">
          {TICKS.map((tick) => (
            <span
              key={tick}
              style={{ bottom: `${(tick / AXIS_PERCENT) * 100}%` }}
              className="absolute left-0 translate-y-1/2 leading-5"
            >
              {tick}%
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
              style={{ bottom: `${(tick / AXIS_PERCENT) * 100}%` }}
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
            style={{ left: `${getX(activeIndex)}%`, top: `${getY(active)}%` }}
            className="absolute size-2 -translate-1/2 rounded-full bg-foreground ring-2 ring-background"
          />
        </div>
        <div className="relative col-start-2 mt-1 h-6">
          {DATE_TICKS.map((tick) => (
            <span
              key={tick.label}
              style={{ left: `${getX(tick.index)}%` }}
              className={cn(
                "absolute top-0 flex w-0 flex-col items-start gap-1",
                tick.isTight && "max-sm:hidden",
              )}
            >
              <span className="h-1.5 w-px bg-input" />
              <span
                className={cn(
                  "leading-5 whitespace-nowrap",
                  tick.index > 0 && "-translate-x-1/2",
                  tick.index === LAST_INDEX && "-translate-x-full",
                )}
              >
                {tick.label}
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
            <tr key={run.date + run.passed}>
              <td>{run.label}</td>
              <td>{run.passed.toLocaleString()}</td>
              <td>{getTest262Percent(run)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};
