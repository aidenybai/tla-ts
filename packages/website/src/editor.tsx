import "./editor.css";
import { App } from "@/components/viewer/app";
import { Spinner } from "@/components/ui/spinner";
import { usePathname } from "@/lib/navigation";
import { getRouteName } from "@/lib/route";
import { getFileTitle } from "@/lib/source";
import { buildViewFile } from "@/lib/view-model";
import type { Example } from "@/model";
import { TYPESCRIPT_EXAMPLES } from "./typescript-examples";
import { useCompile } from "./use-compile";

const DEFAULT_NAME = "die-hard";

const EXAMPLES: Example[] = TYPESCRIPT_EXAMPLES.map((example) => ({
  file: example.fileName,
  name: example.fileName.replace(/\.ts$/, ""),
}));

const NAMES = new Set(EXAMPLES.map((example) => example.name));

export const Editor = () => {
  const routeName = getRouteName(usePathname());
  const name = routeName !== undefined && NAMES.has(routeName) ? routeName : DEFAULT_NAME;
  const example =
    TYPESCRIPT_EXAMPLES.find((candidate) => candidate.fileName === `${name}.ts`) ??
    TYPESCRIPT_EXAMPLES[0];
  const compiled = useCompile(example.source, example.fileName);
  const compilation = compiled.compilation;
  if (compiled.error !== undefined)
    return (
      <pre className="h-dvh overflow-auto px-4 py-4 font-mono whitespace-pre-wrap text-destructive sm:px-5">
        {compiled.error}
      </pre>
    );
  if (compilation === undefined || compilation.input !== example.source)
    return <Spinner className="h-dvh" />;
  return (
    <>
      <title>{`${getFileTitle(example.fileName)} · tla-ts`}</title>
      <App
        examples={EXAMPLES}
        name={name}
        view={buildViewFile(example.fileName, example.source, compilation.spec)}
      />
    </>
  );
};
