import tutorial from "virtual:tutorial";
import { Content } from "@/components/content";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Section } from "@/components/section";
import { Link } from "@/components/ui/link";

const Page = () => (
  <main className="mx-auto max-w-[692px] px-6 py-16 text-prose sm:py-28">
    <Hero.Root>
      <Hero.Title>TLA+ for TypeScript developers</Hero.Title>
      <Hero.Body>
        <p>
          <Link href="/">TLA-ts</Link> runs a TypeScript file and checks every state the file can
          reach. This guide shows how it reads your code, and how to write a file it can check.
        </p>
      </Hero.Body>
    </Hero.Root>
    <div className="mt-20 flex flex-col gap-20">
      <Content sections={tutorial} />
      <Section.Root>
        <Section.Title>Next steps</Section.Title>
        <p className="text-pretty">
          Try your own file in the <Link href="/playground">playground</Link>. The{" "}
          <Link href="https://github.com/aidenybai/tla-ts/blob/main/docs/typescript.md">
            TypeScript reference
          </Link>{" "}
          lists every type, tag, and limit.
        </p>
      </Section.Root>
    </div>
    <Footer />
  </main>
);

export default Page;
