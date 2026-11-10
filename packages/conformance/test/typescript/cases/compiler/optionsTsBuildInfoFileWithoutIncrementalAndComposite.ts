/*---
description: Ported from TypeScript's tests/cases/compiler/optionsTsBuildInfoFileWithoutIncrementalAndComposite.ts.
outcome: success
source: tests/cases/compiler/optionsTsBuildInfoFileWithoutIncrementalAndComposite.ts
---*/
// @target: es2015
// @tsBuildInfoFile: /a/tsconfig.tsbuildinfo

const x = "Hello World";

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
