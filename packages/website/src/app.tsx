import { Monitor, Moon, Sun } from "@phosphor-icons/react";
import { BenchmarkChart } from "./components/benchmark-chart";
import { Code, Example, Hero, Section, ThemeSwitcher } from "./components/parts";
import { Test262Chart } from "./components/test262-chart";
import { buttonVariants } from "./components/ui/button-variants";
import { Link } from "./components/ui/link";
import { cn } from "cn";
import { getTest262Percent, TEST262_RUNS } from "./test262";

const INLINE_CODE_CLASS_NAME = "rounded-md border bg-card px-1 py-0.5 text-[13px] text-foreground";

export const App = () => (
  <main className="mx-auto max-w-[700px] px-4 pt-16 pb-16 text-prose lg:pt-[92px]">
    <Hero.Root>
      <Hero.Title>TLA-ts</Hero.Title>
      <Hero.Body>
        <p>
          TLA-ts formally verifies your TypeScript code with{" "}
          <Link href="https://lamport.azurewebsites.net/tla/tla.html">TLA+</Link>.
        </p>
        <a
          href="https://github.com/aidenybai/tla-ts"
          className={cn(buttonVariants(), "w-fit text-foreground")}
        >
          <svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className="size-4">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
          GitHub
        </a>
      </Hero.Body>
    </Hero.Root>
    <div className="mt-12 flex flex-col gap-12">
      <Section.Root>
        <Section.Title>How it works</Section.Title>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 marker:text-faint">
          <li>
            Run <code className={INLINE_CODE_CLASS_NAME}>npx tla-ts [file].ts</code>
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
        <Code.Root language="shellscript" code="npm install tla-ts">
          <Code.Content />
          <Code.Actions>
            <Code.Copy />
          </Code.Actions>
        </Code.Root>
        <p className="text-pretty">
          Or skip the install and run{" "}
          <code className={INLINE_CODE_CLASS_NAME}>npx tla-ts [file].ts</code> directly.
        </p>
      </Section.Root>
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
        <ThemeSwitcher.Root>
          <ThemeSwitcher.Option value="system" label="System theme">
            <Monitor className="size-4" />
          </ThemeSwitcher.Option>
          <ThemeSwitcher.Option value="light" label="Light theme">
            <Sun className="size-4" />
          </ThemeSwitcher.Option>
          <ThemeSwitcher.Option value="dark" label="Dark theme">
            <Moon className="size-4" />
          </ThemeSwitcher.Option>
        </ThemeSwitcher.Root>
      </div>
    </footer>
  </main>
);
