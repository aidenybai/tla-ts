import { Play } from "@phosphor-icons/react";
import { BenchmarkChart } from "./components/benchmark-chart";
import { GitHubIcon } from "./components/github-icon";
import { Code, Example, Hero, Section } from "./components/parts";
import { Reference } from "./components/reference";
import { ThemeMenu } from "./components/theme-menu";
import { InlineCode } from "./components/ui/inline-code";
import { Test262Chart } from "./components/test262-chart";
import { buttonVariants } from "./components/ui/button-variants";
import { Link } from "./components/ui/link";
import { cn } from "cn";
import { install } from "virtual:site-data";
import { getTest262Percent, TEST262_RUNS } from "./test262";

export const App = () => (
  <main className="mx-auto max-w-[700px] px-4 pt-16 pb-16 text-prose lg:pt-[92px]">
    <Hero.Root>
      <Hero.Title>TLA-ts</Hero.Title>
      <Hero.Body>
        <p>
          Formal verification for your existing TypeScript code via{" "}
          <Link href="https://lamport.azurewebsites.net/tla/tla.html">TLA+</Link>.
        </p>
        <div className="flex gap-2">
          <a href="/playground" className={buttonVariants({ variant: "primary" })}>
            <Play weight="fill" className="size-3" />
            Playground
          </a>
          <a
            href="https://github.com/aidenybai/tla-ts"
            className={cn(buttonVariants(), "text-foreground")}
          >
            <GitHubIcon />
            GitHub
          </a>
        </div>
      </Hero.Body>
    </Hero.Root>
    <div className="mt-12 flex flex-col gap-12">
      <Section.Root>
        <Section.Title>How it works</Section.Title>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 marker:text-faint">
          <li>
            Run <InlineCode>npx tla-ts [file].ts</InlineCode>
          </li>
          <li>TLA-ts transpiles TypeScript into TLA+</li>
          <li>TLA-ts model checks TypeScript code and finds violations</li>
        </ol>
        <Example.Root>
          <Example.Description />
          <Example.Source />
          <Example.Hint />
        </Example.Root>
      </Section.Root>
      <Section.Root>
        <Section.Title>Install</Section.Title>
        <Code.Root source={install}>
          <Code.Content />
          <Code.Actions>
            <Code.Copy />
          </Code.Actions>
        </Code.Root>
        <p className="text-pretty">
          Or skip the install and run <InlineCode>npx tla-ts [file].ts</InlineCode> directly.
        </p>
      </Section.Root>
      <Reference />
      <Section.Root>
        <Section.Title>About</Section.Title>
        <p className="text-pretty">
          TLA-ts is a research project by <Link href="https://aidenybai.com">Aiden Bai</Link>.
        </p>
        <p className="text-pretty">
          Under the hood, TLA-ts is a transpiler that turns TypeScript/JavaScript into TLA+, and
          uses a 1:1 reimplementation of{" "}
          <Link href="https://lamport.azurewebsites.net/tla/tools.html">TLC</Link>/
          <Link href="https://proofs.tlapl.us">TLAPM</Link> in TypeScript that runs 2× faster.
        </p>
        <BenchmarkChart />
        <p className="text-pretty">
          TLA-ts currently maintains{" "}
          {getTest262Percent(TEST262_RUNS[TEST262_RUNS.length - 1].passed)} conformance with{" "}
          <Link href="https://github.com/tc39/test262">test262</Link>.
        </p>
        <Test262Chart />
      </Section.Root>
    </div>
    <footer className="mt-16 flex items-center justify-between border-t pt-6">
      <p className="text-sm text-muted-foreground">
        Made by <Link href="https://aidenybai.com">Aiden Bai</Link>
      </p>
      <div className="flex items-center gap-3">
        <span className="text-sm">
          <Link href="https://github.com/aidenybai/tla-ts">GitHub</Link>
        </span>
        <ThemeMenu />
      </div>
    </footer>
  </main>
);
