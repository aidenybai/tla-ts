import { CodeActions, CodeContent, CodeCopy, CodeFooter, CodeRoot, CodeRun } from "./code";
import {
  ExampleDescription,
  ExampleGraph,
  ExampleHint,
  ExampleRoot,
  ExampleSource,
} from "./example";
import { HeroBody, HeroRoot, HeroTitle } from "./hero";
import { ResultBody, ResultHeader, ResultRoot, ResultSection } from "./result";
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

export const Result = {
  Root: ResultRoot,
  Header: ResultHeader,
  Body: ResultBody,
  Section: ResultSection,
};

export const Section = {
  Root: SectionRoot,
  Title: SectionTitle,
};
