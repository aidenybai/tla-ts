/*---
description: Ported from TypeScript's tests/cases/compiler/assignmentToConditionalBrandedStringTemplateOrMapping.ts.
outcome: success
source: tests/cases/compiler/assignmentToConditionalBrandedStringTemplateOrMapping.ts
---*/
// @target: es2015
let a: (<T>() => T extends `${'a' & { a: 1 }}` ? 1 : 2) = null!;
let b: (<T>() => T extends `${'a' & { a: 1 }}` ? 1 : 2) = null!;

a = b;

let c: (<T>() => T extends Uppercase<'a' & { a: 1 }> ? 1 : 2) = null!;
let d: (<T>() => T extends Uppercase<'a' & { a: 1 }> ? 1 : 2) = null!;

c = d;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
