import { CodeActions, CodeContent, CodeCopy, CodeFooter, CodeRoot, CodeRun } from "./code";
import {
  ExampleDescription,
  ExampleHint,
  ExampleRoot,
  ExampleSearch,
  ExampleSource,
} from "./example";
import { HeroBody, HeroRoot, HeroTitle } from "./hero";
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
  Search: ExampleSearch,
  Hint: ExampleHint,
};

export const Hero = {
  Root: HeroRoot,
  Title: HeroTitle,
  Body: HeroBody,
};

export const Section = {
  Root: SectionRoot,
  Title: SectionTitle,
};
