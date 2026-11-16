import { useCopy } from "../use-copy";
import { CopyIcon } from "./copy-icon";
import { Button } from "./ui/button";

interface PromptProps {
  text: string;
}

export const Prompt = (props: PromptProps) => {
  const copy = useCopy(props.text);
  return (
    <div className="flex items-start gap-2 rounded-xl bg-card py-2.5 pr-1.5 pl-4 shadow-raised">
      <p className="min-w-0 flex-1 py-0.5 text-sm text-pretty text-foreground">{props.text}</p>
      <Button size="icon" aria-label={copy.isCopied ? "Copied" : "Copy prompt"} onClick={copy.copy}>
        <CopyIcon isCopied={copy.isCopied} />
      </Button>
    </div>
  );
};
