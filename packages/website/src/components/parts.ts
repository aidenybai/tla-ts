import { CodeActions, CodeContent, CodeCopy, CodeFooter, CodeRoot, CodeRun } from "./code";
import { ExampleDescription, ExampleHint, ExampleRoot, ExampleSource } from "./example";
import { HeroBody, HeroRoot, HeroTitle } from "./hero";
import { SectionRoot, SectionTitle } from "./section";
import { ThemeSwitcherOption, ThemeSwitcherRoot } from "./theme-switcher";

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

export const ThemeSwitcher = {
  Root: ThemeSwitcherRoot,
  Option: ThemeSwitcherOption,
};
