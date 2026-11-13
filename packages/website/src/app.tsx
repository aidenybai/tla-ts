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
          <a
            href="https://github.com/aidenybai/tla-ts"
            className={buttonVariants({ variant: "primary" })}
          >
            <GitHubIcon />
            GitHub
          </a>
          <a href="/playground" className={cn(buttonVariants(), "text-foreground")}>
            <Play weight="fill" className="size-3" />
            Playground
          </a>
        </div>
      </Hero.Body>
    </Hero.Root>
    <div className="mt-12 flex flex-col gap-12">
      <Section.Root>
        <Section.Title>How it works</Section.Title>
        <p className="text-pretty">
          Your test likes a post, then unlikes it. It passes.
          <br />
          TLA-ts unlikes it first. The count is -1.
        </p>
        <Example.Root>
          <Example.Description />
          <Example.Source />
          <Example.Hint />
        </Example.Root>
        <ul className="mt-6 flex flex-col gap-1.5">
          <li>
            <InlineCode>likes</InlineCode> is the state. It's the value that changes.
          </li>
          <li>
            <InlineCode>like</InlineCode> and <InlineCode>unlike</InlineCode> are the actions. A
            user can call them in any order.
          </li>
          <li>
            <InlineCode>neverNegative</InlineCode> is the rule. It must be true after every call.
          </li>
        </ul>
        <p className="text-pretty">
          TLA-ts calls the actions in every order and checks the rule after each call. This search
          is called model checking.
        </p>
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
