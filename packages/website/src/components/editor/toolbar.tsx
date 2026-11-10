import { ChevronDown, Moon, Sun, WrapText } from "lucide-react";
import { Button, getButtonClassName } from "@/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/ui/menu";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { useViewer } from "./viewer-context";

const ExampleMenu = () => {
  const viewer = useViewer();
  return (
    <Menu>
      <MenuTrigger className={cn(getButtonClassName({}), "min-w-0 font-mono text-ink")}>
        <span className="truncate">{viewer.example.fileName}</span>
        <ChevronDown className="text-muted" />
      </MenuTrigger>
      <MenuContent>
        <MenuRadioGroup
          value={viewer.example.fileName}
          onValueChange={(fileName) => {
            const example = viewer.examples.find((candidate) => candidate.fileName === fileName);
            if (example !== undefined) viewer.setExample(example);
          }}
        >
          {viewer.examples.map((example) => (
            <MenuRadioItem key={example.fileName} value={example.fileName} className="font-mono">
              {example.fileName}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
};

export const Toolbar = () => {
  const viewer = useViewer();
  return (
    <div className="flex h-11 items-center gap-2 border-b border-rule px-3 sm:gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <a href="/" className="hidden shrink-0 px-1 font-medium text-ink sm:inline">
          tla-ts
        </a>
        <span className="hidden text-faint sm:inline">/</span>
        <ExampleMenu />
      </div>
      <TabsList aria-label="Output">
        <TabsTrigger value="tla">TLA+</TabsTrigger>
        <TabsTrigger value="config">Config</TabsTrigger>
        <TabsTrigger value="outline">Outline</TabsTrigger>
      </TabsList>
      <Toggle
        aria-label="Wrap lines"
        title="Wrap lines"
        pressed={viewer.isWrapped}
        onPressedChange={viewer.setWrapped}
      >
        <WrapText />
        <span className="hidden sm:inline">Wrap</span>
      </Toggle>
      <Button
        size="icon"
        aria-label="Toggle theme"
        title="Toggle theme"
        onClick={viewer.toggleTheme}
      >
        {viewer.theme === "dark" ? <Sun /> : <Moon />}
      </Button>
    </div>
  );
};
