import { File, type FileOptions } from "@pierre/diffs/react";

const FILE_OPTIONS: FileOptions<undefined, undefined> = {
  theme: "github-light",
  themeType: "light",
  overflow: "scroll",
  disableFileHeader: true,
  unsafeCSS:
    ":host { background-color: transparent; letter-spacing: normal; --diffs-bg: transparent; --diffs-font-size: 13px; --diffs-line-height: 20px; --diffs-gap-block: 16px; --diffs-gap-inline: 2ch; --diffs-font-family: var(--font-mono); } [data-gutter], [data-column-number] { background: transparent; color: #bbb; } * { scrollbar-width: thin; scrollbar-color: rgb(0 0 0 / 0.15) transparent; }",
};

interface CodeFileProps {
  name: string;
  contents: string;
  onChange?: (contents: string) => void;
}

export const CodeFile = ({ name, contents, onChange }: CodeFileProps) => (
  <File
    file={{ name, contents }}
    options={FILE_OPTIONS}
    edit={onChange !== undefined}
    editStateKey={name}
    onEditChange={(event) => onChange?.(event.file.contents)}
    disableWorkerPool
  />
);
