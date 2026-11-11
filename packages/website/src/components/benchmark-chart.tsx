import { useInView } from "motion/react";
import { Fragment, useRef } from "react";
import { cn } from "cn";
import { benchmarks } from "virtual:site-data";

const RACE_MS = 3000;

const AXIS_TICKS = [
  { share: 0, label: "0%" },
  { share: 0.5, label: "50%" },
  { share: 1, label: "100% of TLC's time" },
];

export const BenchmarkChart = () => {
  const chartRef = useRef<HTMLElement>(null);
  const isInView = useInView(chartRef, { once: true, amount: 0.6 });
  return (
    <figure
      ref={chartRef}
      className="my-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2.5 sm:grid-cols-[auto_1fr_auto] text-sm tabular-nums"
    >
      {benchmarks.map((benchmark) => (
        <Fragment key={benchmark.name}>
          <span className="h-5 leading-5 text-faint max-sm:col-span-2 max-sm:-mb-1.5 max-sm:not-first:mt-1.5">
            {benchmark.name}
          </span>
          <div
            title={`${benchmark.tlaTsSeconds} s, against TLC's ${benchmark.tlcSeconds} s`}
            className="relative my-1.5 h-2 bg-accent"
          >
            <div
              style={{
                scale: `${isInView ? 1 : 0} 1`,
                transitionDuration: `${RACE_MS}ms`,
              }}
              className="absolute inset-0 origin-left bg-border transition-[scale] ease-linear motion-reduce:transition-none"
            />
            <div
              style={{
                scale: `${isInView ? benchmark.tlaTsSeconds / benchmark.tlcSeconds : 0} 1`,
                transitionDuration: `${(benchmark.tlaTsSeconds / benchmark.tlcSeconds) * RACE_MS}ms`,
              }}
              className="absolute inset-0 origin-left bg-muted-foreground transition-[scale] ease-linear motion-reduce:transition-none"
            />
          </div>
          <span
            style={{ transitionDelay: `${RACE_MS}ms` }}
            className={cn(
              "h-5 text-right leading-5 text-foreground transition-opacity duration-300 ease-out motion-reduce:transition-none",
              !isInView && "opacity-0",
            )}
          >
            {benchmark.speedup}
          </span>
        </Fragment>
      ))}
      <div className="relative h-8 border-t border-border sm:col-start-2">
        {AXIS_TICKS.map((tick) => (
          <span
            key={tick.share}
            style={{ left: `${tick.share * 100}%` }}
            className={cn(
              "absolute top-0 flex flex-col gap-1 text-xs font-medium whitespace-nowrap text-faint",
              tick.share === 0.5 && "-translate-x-1/2 items-center",
              tick.share === 1 && "-translate-x-full items-end",
            )}
          >
            <span className="h-1.5 w-px bg-border" />
            {tick.label}
          </span>
        ))}
      </div>
    </figure>
  );
};
