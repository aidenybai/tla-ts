import { CodeActions, CodeContent, CodeCopy, CodeFooter, CodeRoot, CodeRun } from "./code";
import {
  ExampleDescription,
  ExampleGraph,
  ExampleHint,
  ExampleRoot,
  ExampleSource,
} from "./example";
import { HeroBody, HeroRoot, HeroTitle } from "./hero";
import { PlaygroundRoot, PlaygroundWorkspace } from "./playground";
import {
  PlaygroundFiles,
  PlaygroundHeader,
  PlaygroundRun,
  PlaygroundSettings,
} from "./playground-header";
import {
  PlaygroundArrows,
  PlaygroundOutput,
  PlaygroundPanes,
  PlaygroundSource,
} from "./playground-panes";
import { PlaygroundResult } from "./playground-result";
import { SectionRoot, SectionTitle } from "./section";

export const Code = {
  Root: CodeRoot,
  Content: CodeContent,
  Actions: CodeActions,
  Footer: CodeFooter,
  Run: CodeRun,
  Copy: CodeCopy,
};

export const Example = {
  Root: ExampleRoot,
  Description: ExampleDescription,
  Source: ExampleSource,
  Graph: ExampleGraph,
  Hint: ExampleHint,
};

export const Hero = {
  Root: HeroRoot,
  Title: HeroTitle,
  Body: HeroBody,
};

export const Playground = {
  Root: PlaygroundRoot,
  Header: PlaygroundHeader,
  Settings: PlaygroundSettings,
  Files: PlaygroundFiles,
  Run: PlaygroundRun,
  Workspace: PlaygroundWorkspace,
  Result: PlaygroundResult,
  Arrows: PlaygroundArrows,
  Panes: PlaygroundPanes,
  Source: PlaygroundSource,
  Output: PlaygroundOutput,
};

export const Section = {
  Root: SectionRoot,
  Title: SectionTitle,
};
