/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveSpecializationOfExtendedTypeWithError.ts.
outcome: success
source: tests/cases/compiler/recursiveSpecializationOfExtendedTypeWithError.ts
---*/
// @target: es2015
// @lib: es5
interface HTMLSelectElement {
    options: HTMLSelectElement;
    <A>(name: A): any;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
