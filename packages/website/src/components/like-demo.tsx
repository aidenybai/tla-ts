import { Check, Heart, HeartBreak, X } from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

const SHOWN_CALLS = 5;

interface Call {
  name: "like" | "unlike";
  likes: number;
  isLiked: boolean;
}

const START: Call = { name: "like", likes: 0, isLiked: false };
const HINT_CALLS = 8;

// The same two functions as the example's code, with its mistake.
const getNext = (last: Call, name: Call["name"]): Call => {
  if (name === "like") return { name, likes: last.likes + 1, isLiked: true };
  return last.isLiked ? { name, likes: last.likes - 1, isLiked: false } : { ...last, name };
};

const isBreaking = (call: Call) => !call.isLiked && call.likes !== 0;

export const LikeDemo = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const last = calls.at(-1) ?? START;
  const isBroken = isBreaking(last);
  const call = (name: Call["name"]) => setCalls([...calls, getNext(last, name)]);
  const shown = calls.slice(-SHOWN_CALLS);
  return (
    <div className="my-2 grid gap-x-6 gap-y-5 rounded-[18px] bg-card p-4 shadow-raised sm:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            aria-label="Like"
            disabled={isBroken}
            onClick={() => call("like")}
            className="size-11 text-destructive"
          >
            <Heart weight={last.isLiked ? "fill" : "regular"} className="size-5" />
          </Button>
          <span
            key={calls.length}
            className={cn(
              "min-w-[2ch] text-center text-2xl text-foreground tabular-nums",
              isBroken && "text-destructive motion-safe:animate-shake",
            )}
          >
            {last.likes}
          </span>
          <Button disabled={isBroken} onClick={() => call("unlike")} className="h-11 pl-2">
            <HeartBreak className="size-4" />
            Unlike
          </Button>
        </div>
        <p aria-live="polite" className="text-sm text-pretty text-muted-foreground">
          {isBroken ? (
            <>
              You broke it in {calls.length} {calls.length === 1 ? "call" : "calls"}.{" "}
              <Button variant="link" size="inline" onClick={() => setCalls([])}>
                Reset
              </Button>
            </>
          ) : calls.length >= HINT_CALLS ? (
            "Hint: what if someone likes twice?"
          ) : (
            "Rule: an empty heart means zero likes."
          )}
        </p>
      </div>
      <ol className="flex flex-col gap-1.5 font-mono text-xs sm:border-l sm:pl-6">
        <li className="grid grid-cols-[5.5rem_1fr] items-center">
          <span className="text-faint">{calls.length > shown.length ? "..." : "start"}</span>
          {calls.length === shown.length && <State call={START} />}
        </li>
        {shown.map((shownCall, index) => (
          <li
            key={calls.length - shown.length + index}
            className="grid grid-cols-[5.5rem_1fr] items-center motion-safe:animate-chip-in"
          >
            <span className="text-faint">{shownCall.name}()</span>
            <State call={shownCall} />
          </li>
        ))}
      </ol>
    </div>
  );
};

interface StateProps {
  call: Call;
}

const State = (props: StateProps) => (
  <span
    className={cn(
      "flex w-fit items-center gap-1 rounded-md border px-1.5 py-0.5",
      isBreaking(props.call)
        ? "border-transparent bg-destructive/15 text-destructive motion-safe:animate-shake"
        : "text-foreground",
    )}
  >
    likes = {props.call.likes}, {props.call.isLiked ? "liked" : "not liked"}
    {isBreaking(props.call) ? (
      <X weight="bold" className="size-3" />
    ) : (
      <Check weight="bold" className="size-3 text-success" />
    )}
  </span>
);
