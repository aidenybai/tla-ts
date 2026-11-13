import { Check, X } from "@phosphor-icons/react";
import { cn } from "cn";
import type { RunResult } from "../run-worker";

interface VerdictProps {
  result: RunResult;
}

export const Verdict = (props: VerdictProps) => (
  <span className="flex min-w-0 items-center gap-1.5 transition-opacity duration-200 ease-out starting:opacity-0">
    {props.result.isPassed ? (
      <Check weight="bold" className="shrink-0 text-success" />
    ) : (
      <X weight="bold" className="shrink-0 text-destructive" />
    )}
    <span
      className={cn(
        "min-w-0 truncate",
        props.result.isPassed ? "text-success" : "text-destructive",
      )}
    >
      {props.result.title}
    </span>
  </span>
);
