import { CopyButton } from "./copy-button";

interface PromptProps {
  text: string;
}

export const Prompt = (props: PromptProps) => (
  <div className="flex items-start gap-2 rounded-xl bg-card py-2.5 pr-1.5 pl-4 shadow-raised">
    <p className="min-w-0 flex-1 py-0.5 text-sm text-pretty text-foreground">{props.text}</p>
    <CopyButton text={props.text} />
  </div>
);
