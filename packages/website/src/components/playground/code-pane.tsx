import { CodeFile } from "../code-file";
import { usePlayground } from "./playground-context";

export const CodePane = () => {
  const playground = usePlayground();
  const example = playground.example;
  return (
    <div key={example.name} className="min-h-0 flex-1 overflow-auto border-t">
      <CodeFile
        name={`${example.name}.tla`}
        contents={example.spec}
        onChange={(contents) => {
          playground.specRef.current = contents;
        }}
      />
      <p className="mt-4 border-t px-4 pt-4 pb-1 font-mono text-[13px] text-gray-1000">
        {example.name}.cfg
      </p>
      <CodeFile
        name={`${example.name}.cfg`}
        contents={example.config}
        onChange={(contents) => {
          playground.configRef.current = contents;
        }}
      />
    </div>
  );
};
