import { cn } from "cn";

// Each state is named by the choices that lead to it, so "1.2" is the third step from the second
// step from the start.
const STATES = [
  "",
  "0",
  "0.0",
  "0.0.0",
  "0.1",
  "0.1.0",
  "0.1.1",
  "1",
  "1.0",
  "1.1",
  "1.1.0",
  "1.2",
  "1.2.0",
  "1.2.1",
  "2",
  "2.0",
  "2.1",
  "2.1.0",
  "2.1.1",
];
const TESTED_STATES = new Set(["", "0", "0.0", "0.0.0", "2", "2.0"]);
const VIOLATING_STATE = "1.2.1";

const COLUMN_PX = 28;
const ROW_PX = 44;
const MARGIN_PX = 10;
const RADIUS_PX = 5;

const getParent = (state: string) =>
  state === "" ? undefined : state.slice(0, Math.max(0, state.lastIndexOf(".")));
const getDepth = (state: string) => (state === "" ? 0 : state.split(".").length);

const LEAVES = STATES.filter((state) => !STATES.some((other) => getParent(other) === state));
const isUnder = (state: string, ancestor: string) =>
  ancestor === "" || state === ancestor || state.startsWith(`${ancestor}.`);
const isOnViolatingPath = (state: string) => isUnder(VIOLATING_STATE, state);

// A state sits over the middle of the leaves under it.
const getX = (state: string) => {
  const columns = LEAVES.flatMap((leaf, index) => (isUnder(leaf, state) ? [index] : []));
  return MARGIN_PX + ((columns[0] + columns[columns.length - 1]) / 2) * COLUMN_PX;
};
const getY = (state: string) => MARGIN_PX + getDepth(state) * ROW_PX;

const WIDTH_PX = MARGIN_PX * 2 + (LEAVES.length - 1) * COLUMN_PX;
const HEIGHT_PX = MARGIN_PX * 2 + Math.max(...STATES.map(getDepth)) * ROW_PX;

const KINDS = [
  { kind: "checked", label: "Checked" },
  { kind: "violated", label: "Violated" },
  { kind: "unchecked", label: "Not checked" },
] as const;

type Kind = (typeof KINDS)[number]["kind"];

interface DotProps {
  kind: Kind;
  x: number;
  y: number;
}

const Dot = (props: DotProps) => (
  <>
    {props.kind === "violated" && (
      <circle cx={props.x} cy={props.y} r={RADIUS_PX + 3} className="fill-destructive/20" />
    )}
    <circle
      cx={props.x}
      cy={props.y}
      r={props.kind === "unchecked" ? RADIUS_PX - 0.75 : RADIUS_PX}
      strokeWidth={1.5}
      className={cn(
        props.kind === "checked" && "fill-success",
        props.kind === "violated" && "fill-destructive",
        props.kind === "unchecked" && "fill-background stroke-input",
      )}
    />
  </>
);

interface TreeProps {
  title: string;
  caption: string;
  label: string;
  isEveryStateChecked: boolean;
}

const Tree = (props: TreeProps) => {
  const getKind = (state: string): Kind => {
    if (!props.isEveryStateChecked) return TESTED_STATES.has(state) ? "checked" : "unchecked";
    return state === VIOLATING_STATE ? "violated" : "checked";
  };
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-foreground">{props.title}</h3>
      <svg
        role="img"
        aria-label={props.label}
        viewBox={`0 0 ${WIDTH_PX} ${HEIGHT_PX}`}
        className="w-full max-w-[272px]"
      >
        {STATES.flatMap((state) => {
          const parent = getParent(state);
          if (parent === undefined) return [];
          const isChecked = getKind(state) !== "unchecked";
          return [
            <line
              key={state}
              x1={getX(parent)}
              y1={getY(parent)}
              x2={getX(state)}
              y2={getY(state)}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray={isChecked ? undefined : "1 4"}
              className={cn(
                !isChecked && "stroke-input",
                isChecked && "stroke-faint",
                props.isEveryStateChecked && isOnViolatingPath(state) && "stroke-destructive",
              )}
            />,
          ];
        })}
        {STATES.map((state) => (
          <Dot key={state} kind={getKind(state)} x={getX(state)} y={getY(state)} />
        ))}
      </svg>
      <p className="text-sm text-pretty text-muted-foreground">{props.caption}</p>
    </div>
  );
};

export const CoverageDiagram = () => (
  <figure className="flex flex-col gap-6">
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      <Tree
        title="Testing"
        caption="A test follows the calls you wrote. The rest is never run."
        label="A tree of 19 states. Two tests check 6 of them. The other 13 are not checked."
        isEveryStateChecked={false}
      />
      <Tree
        title="Model checking"
        caption="TLA-ts makes every call from every state, and finds the one that breaks."
        label="The same tree of 19 states. All are checked, and one in the last row violates a rule."
        isEveryStateChecked
      />
    </div>
    <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-faint">
      {KINDS.map((item) => (
        <span key={item.kind} className="flex items-center gap-1.5">
          <svg aria-hidden viewBox="0 0 16 16" className="size-4">
            <Dot kind={item.kind} x={8} y={8} />
          </svg>
          {item.label}
        </span>
      ))}
    </figcaption>
  </figure>
);
