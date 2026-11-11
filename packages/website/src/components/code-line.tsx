import { X } from "@phosphor-icons/react";
import { cn } from "cn";
import type { Token } from "../site-data";
import type { LineNote } from "../run-worker";

const WORDS = /\s+|[A-Za-z_]\w*|\d+|[^\sA-Za-z_\d]+/g;

interface CodeLineProps {
  tokens: Token[];
  note?: LineNote;
  isActive?: boolean;
  className?: string;
}

export const CodeLine = (props: CodeLineProps) => (
  <span
    className={cn(
      "flex min-h-[1.7em] gap-4 transition-[background-color,box-shadow] duration-200 ease-out",
      props.isActive && "bg-muted shadow-[inset_2px_0_0_var(--foreground)]",
      props.note?.tone === "danger" &&
        "bg-destructive/10 shadow-[inset_2px_0_0_var(--destructive)]",
      props.className,
    )}
  >
    <span className="min-w-0 flex-1 break-words whitespace-pre-wrap">
      {props.tokens
        .flatMap((token) =>
          (token.content.match(WORDS) ?? []).map((text) => ({ text, style: token.style })),
        )
        .map((word, index) =>
          /^\s/.test(word.text) ? (
            word.text
          ) : (
            <span
              key={`${index}:${word.text}`}
              data-token
              style={word.style}
              className="inline-block rounded-xs leading-[1.35] text-(--token-light) dark:text-(--token-dark)"
            >
              {word.text}
            </span>
          ),
        )}
    </span>
    {props.note && (
      <span
        className={cn(
          "flex max-w-1/2 shrink-0 items-center gap-1 self-start transition-opacity duration-200 ease-out starting:opacity-0",
          props.note.tone === "danger" ? "text-destructive" : "text-faint",
        )}
      >
        {props.note.tone === "danger" && <X weight="bold" className="shrink-0" />}
        <span className="truncate">{props.note.text}</span>
      </span>
    )}
  </span>
);
