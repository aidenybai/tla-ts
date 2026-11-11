import { CodeActions, CodeContent, CodeCopy, CodeRoot, CodeRun, CodeStatus } from "./code";
import {
  ExamplesDescription,
  ExamplesList,
  ExamplesPanels,
  ExamplesRoot,
  ExamplesSource,
  ExamplesUsage,
} from "./examples";
import { HeroBody, HeroHeader, HeroLink, HeroRoot, HeroTitle } from "./hero";
import { SectionRoot, SectionTitle } from "./section";

export const Code = {
  Root: CodeRoot,
  Content: CodeContent,
  Actions: CodeActions,
  Status: CodeStatus,
  Run: CodeRun,
  Copy: CodeCopy,
};

export const Examples = {
  Root: ExamplesRoot,
  List: ExamplesList,
  Panels: ExamplesPanels,
  Description: ExamplesDescription,
  Source: ExamplesSource,
  Usage: ExamplesUsage,
};

export const Hero = {
  Root: HeroRoot,
  Header: HeroHeader,
  Title: HeroTitle,
  Body: HeroBody,
  Link: HeroLink,
};

export const Section = {
  Root: SectionRoot,
  Title: SectionTitle,
};
