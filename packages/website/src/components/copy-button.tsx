import { useState } from "react";
import { useCopy } from "../use-copy";
import { CopyIcon } from "./copy-icon";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface CopyButtonProps {
  text: string;
}

export const CopyButton = (props: CopyButtonProps) => {
  const copy = useCopy(props.text);
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Tooltip open={isHovered || copy.isCopied} onOpenChange={setIsHovered}>
      <TooltipTrigger
        closeOnClick={false}
        render={
          <Button size="icon" aria-label={copy.isCopied ? "Copied" : "Copy"} onClick={copy.copy} />
        }
      >
        <CopyIcon isCopied={copy.isCopied} />
      </TooltipTrigger>
      <TooltipContent>{copy.isCopied ? "Copied!" : "Copy"}</TooltipContent>
    </Tooltip>
  );
};
