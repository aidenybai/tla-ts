import { useState } from "react";
import { useCopy } from "@/hooks/use-copy";
import { CopyIcon } from "./copy-icon";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

interface CopyButtonProps {
  text: string;
}

export const CopyButton = (props: CopyButtonProps) => {
  const copy = useCopy(props.text);
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Tooltip.Root open={isHovered || copy.isCopied} onOpenChange={setIsHovered}>
      <Tooltip.Trigger
        closeOnClick={false}
        render={
          <Button size="icon" aria-label={copy.isCopied ? "Copied" : "Copy"} onClick={copy.copy} />
        }
      >
        <CopyIcon isCopied={copy.isCopied} />
      </Tooltip.Trigger>
      <Tooltip.Content>{copy.isCopied ? "Copied!" : "Copy"}</Tooltip.Content>
    </Tooltip.Root>
  );
};
