import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { compilations } from "virtual:compilations";
import { examples } from "virtual:site-data";
import { cn } from "cn";
import type { Precompiled } from "@/lib/compilation";
import { getHighlightColors } from "@/lib/highlight-colors";
import { getLineMarks } from "@/lib/line-marks";
import { getOutputRows, getRunLines } from "@/lib/output-rows";
import { getTriedStates } from "@/lib/search";
import { useRun } from "@/hooks/use-run";
import { Code } from "./code";
import { MazeBoard } from "./maze-board";
import { getStateSquare, MAZE_HEART } from "./maze-scene";
import { SearchTree } from "./search-tree";

const STAGE = { width: 1920, height: 1080 };
const BEAT_MS = 100;
// The beats the loop's scenes start on: the TypeScript, its TLA+, and the check.
const TLA_BEAT = 16;
const CHECK_BEAT = 34;
const COMMAND_BEAT = 84;
const LOOP_BEATS = 100;
const SCENE_CLASS_NAME =
  "absolute inset-x-20 top-[220px] bottom-16 transition-[opacity,scale,filter] duration-300 ease-out";
const HIDDEN_SCENE_CLASS_NAME = "pointer-events-none scale-95 opacity-0 blur-sm";
const NO_FOLDS: ReadonlySet<string> = new Set();
const START = { x: 0, y: 6 };

const subscribeToResize = (onChange: () => void) => {
  addEventListener("resize", onChange);
  return () => removeEventListener("resize", onChange);
};

// Ten seconds on what TLA-ts does, on a 1920 by 1080 stage that fits the window, to record.
export const Explainer = () => {
  const example = examples[0];
  const runner = useRun(true);
  const [compiled, setCompiled] = useState<Precompiled>();
  const [beat, setBeat] = useState(0);
  const scale = useSyncExternalStore(
    subscribeToResize,
    () => Math.min(innerWidth / STAGE.width, innerHeight / STAGE.height),
    () => 1,
  );
  useEffect(() => {
    void compilations[example.fileName]?.().then(setCompiled);
  }, [example]);
  useEffect(() => {
    if (compiled === undefined) return;
    runner.run({
      source: compiled.compilation.tla,
      config: compiled.compilation.config,
      modules: compiled.compilation.modules,
      isSearchShown: true,
      typescript: { source: example.typescript.code, fileName: example.fileName },
    });
    // The run starts once, when the compilation loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compiled]);
  const search = runner.result?.search;
  // The loop starts once there is a search to play.
  useEffect(() => {
    if (search === undefined) return;
    const startedAt = performance.now();
    // The beat comes from the clock, so a slow frame does not stretch the ten seconds.
    const beats = setInterval(
      () => setBeat(Math.floor((performance.now() - startedAt) / BEAT_MS) % LOOP_BEATS),
      BEAT_MS / 4,
    );
    return () => clearInterval(beats);
  }, [search]);

  const tla = compiled?.tla;
  const isTlaShown = beat >= TLA_BEAT && tla !== undefined;
  const colors = useMemo(
    () => getHighlightColors(example.sourceMarks.map((mark) => mark.name)),
    [example],
  );
  const rows = useMemo(() => {
    const code = tla?.code ?? "";
    return getOutputRows({
      lines: tla?.lines ?? [],
      lineMarks: getLineMarks(code.split("\n"), []),
      source: example.typescript.code,
      sourceMarks: example.sourceMarks,
      openFolds: NO_FOLDS,
      pinnedLines: getRunLines(undefined),
    });
  }, [example, tla]);

  const states = useMemo(() => (search ? getTriedStates(search) : []), [search]);
  const triedCount = Math.min(states.length, Math.max(0, beat - CHECK_BEAT + 1));
  const isFound = states.length > 0 && triedCount === states.length;
  const tried = states.at(triedCount - 1);
  const square = triedCount > 0 ? getStateSquare(tried) : START;
  const parent = states.find((state) => state.id === tried?.parentId);
  const cameFrom = triedCount > 0 && parent ? getStateSquare(parent) : undefined;
  const isChecking = beat >= CHECK_BEAT;
  const headline = isFound
    ? ["Bug found", ` in ${(search?.states.length ?? 1) - 1} moves.`]
    : isChecking
      ? ["Then it tries ", "every move."]
      : beat >= TLA_BEAT
        ? ["TLA-ts turns it into ", "TLA+."]
        : ["You write ", "TypeScript."];
  return (
    <main className="fixed inset-0 flex cursor-none items-center justify-center overflow-hidden bg-background">
      <div
        style={{ width: STAGE.width, height: STAGE.height, zoom: scale }}
        className="relative shrink-0"
      >
        {beat >= COMMAND_BEAT ? (
          <p className="absolute top-14 right-20 rounded-2xl bg-foreground px-8 py-4 font-mono text-4xl text-background motion-safe:animate-drop-in">
            npx tla-ts maze.ts
          </p>
        ) : (
          <p className="absolute top-[72px] right-20 font-pixel text-4xl text-muted-foreground">
            TLA-ts
          </p>
        )}
        <h1
          key={headline.join("")}
          className="absolute top-14 left-20 text-[88px]/[1.1] font-medium tracking-tight motion-safe:animate-drop-in"
        >
          <span className={isFound ? "text-destructive" : "text-muted-foreground"}>
            {headline[0]}
          </span>
          <span className="text-foreground">{headline[1]}</span>
        </h1>
        <div className={cn(SCENE_CLASS_NAME, isChecking && HIDDEN_SCENE_CLASS_NAME)}>
          <div
            style={{ zoom: 2.1 }}
            className="h-full overflow-hidden rounded-[18px] mask-[linear-gradient(to_bottom,black_calc(100%-40px),transparent)]"
          >
            <Code.Root
              source={isTlaShown ? tla : example.typescript}
              rows={isTlaShown ? rows : undefined}
              colors={colors}
            >
              <Code.Content />
            </Code.Root>
          </div>
        </div>
        <div
          className={cn(SCENE_CLASS_NAME, "flex gap-20", !isChecking && HIDDEN_SCENE_CLASS_NAME)}
        >
          <MazeBoard
            label="The maze, with the robot making each move TLA-ts tries."
            view={{
              player: square,
              cameFrom,
              yaw: cameFrom ? Math.atan2(square.x - cameFrom.x, square.y - cameFrom.y) : 0,
              trail: [],
              reached: states
                .slice(0, triedCount)
                .map((state) => ({ ...getStateSquare(state), isFailing: state.isFailing })),
              route: isFound ? search?.states.map(getStateSquare) : undefined,
              isHeartTaken: square.x === MAZE_HEART.x && square.y === MAZE_HEART.y,
              isStill: false,
            }}
            className={cn("w-[820px] shrink-0", isFound && "motion-safe:animate-shake")}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <p className="flex items-baseline gap-5 font-pixel text-foreground tabular-nums">
              <span className={cn("text-[200px]/[1]", isFound && "text-destructive")}>
                {triedCount}
              </span>
              <span className="text-5xl text-muted-foreground">/ {states.length} states</span>
            </p>
            <div style={{ zoom: 3 }} className="w-[280px]">
              <SearchTree
                states={states}
                triedCount={triedCount}
                activeId={triedCount > 0 ? tried?.id : undefined}
                onHover={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
