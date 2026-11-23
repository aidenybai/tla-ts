import { Play } from "@phosphor-icons/react";
import { Code } from "@/components/code";
import { GitHubIcon } from "@/components/github-icon";
import { BenchmarkChart } from "@/components/benchmark-chart";
import { Example } from "@/components/example";
import { Hero } from "@/components/hero";
import { Section } from "@/components/section";
import { Prompt } from "@/components/prompt";
import { Content } from "@/components/content";
import { Footer } from "@/components/footer";
import { Test262Chart } from "@/components/test262-chart";
import { InlineCode } from "@/components/ui/inline-code";
import { buttonVariants } from "@/components/ui/button-variants";
import { Link } from "@/components/ui/link";
import { cn } from "cn";
import { install, prompt, reference } from "virtual:site-data";
import { getTest262Percent, TEST262_RUNS } from "@/lib/test262";

const Page = () => (
  <main className="mx-auto max-w-[692px] px-6 py-16 text-prose sm:py-28">
    <Hero.Root>
      <Hero.Title>TLA-ts</Hero.Title>
      <Hero.Body>
        <p>
          Formally verify TypeScript code with{" "}
          <Link href="https://github.com/tlaplus/tlaplus">TLA+</Link>.
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
    <div className="mt-20 flex flex-col gap-20">
      <Section.Root>
        <Section.Title>How it works</Section.Title>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-pretty marker:text-faint">
          <li>
            Run <InlineCode>npx tla-ts [file].ts</InlineCode>
          </li>
          <li>TLA-ts converts it into TLA+ and formally checks every state</li>
          <li>Get any violations, with the steps that caused them</li>
        </ol>
        <Example.Root>
          <Example.Description />
          <Example.Source />
          <Example.Graph />
          <Example.Hint />
        </Example.Root>
      </Section.Root>
      <Section.Root>
        <Section.Title>Install</Section.Title>
        <p className="text-pretty">Paste this prompt into your coding agent:</p>
        <Prompt text={prompt} />
        <p className="text-pretty">Or install it yourself:</p>
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
      <Content sections={reference} />
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
          TLA-ts currently maintains {getTest262Percent(TEST262_RUNS[TEST262_RUNS.length - 1])}{" "}
          conformance with <Link href="https://github.com/tc39/test262">test262</Link>.
        </p>
        <Test262Chart />
      </Section.Root>
    </div>
    <Footer />
  </main>
);

export default Page;
