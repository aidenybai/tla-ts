import { Check, X } from "@phosphor-icons/react";
import { cn } from "cn";

interface Step {
  call: string;
  state: string;
  verdict: "passed" | "failed" | "unchecked";
}

const TEST_STEPS: Step[] = [
  { call: "like()", state: "likes = 1", verdict: "unchecked" },
  { call: "unlike()", state: "likes = 0", verdict: "passed" },
];

const CHECKER_STEPS: Step[] = [
  { call: "start", state: "likes = 0", verdict: "passed" },
  { call: "like()", state: "likes = 1", verdict: "passed" },
  { call: "unlike()", state: "likes = -1", verdict: "failed" },
];

interface ColumnProps {
  title: string;
  steps: Step[];
  note?: string;
  summary: string;
}

const Column = (props: ColumnProps) => (
  <div className="flex flex-col gap-3 rounded-[14px] bg-card p-4 shadow-raised">
    <h3 className="text-sm text-foreground">{props.title}</h3>
    <ol className="flex flex-col gap-1.5 font-mono text-xs">
      {props.steps.map((step) => (
        <li key={step.call} className="grid grid-cols-[5.5rem_1fr] items-center">
          <span className="text-faint">{step.call}</span>
          <span
            className={cn(
              "flex w-fit items-center gap-1 rounded-md border px-1.5 py-0.5",
              step.verdict === "failed"
                ? "border-transparent bg-destructive/15 text-destructive"
                : "text-foreground",
            )}
          >
            {step.state}
            {step.verdict === "passed" && <Check weight="bold" className="size-3 text-success" />}
            {step.verdict === "failed" && <X weight="bold" className="size-3" />}
          </span>
        </li>
      ))}
    </ol>
    {props.note !== undefined && (
      <p className="pl-[5.5rem] text-xs text-destructive">{props.note}</p>
    )}
    <p className="mt-auto pt-1 text-sm text-pretty text-muted-foreground">{props.summary}</p>
  </div>
);

export const OrderComparison = () => (
  <div className="my-2 grid gap-4 sm:grid-cols-2">
    <Column
      title="Your test"
      steps={TEST_STEPS}
      summary="One order tried, checked once at the end. It passes."
    />
    <Column
      title="TLA-ts"
      steps={CHECKER_STEPS}
      note="Your test never ran this."
      summary="Every order tried, checked after every call. It finds the bug."
    />
  </div>
);
