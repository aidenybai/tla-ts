/*---
description: Ported from TypeScript's tests/cases/compiler/noSubstitutionTemplateStringLiteralTypes.ts.
outcome: success
source: tests/cases/compiler/noSubstitutionTemplateStringLiteralTypes.ts
---*/
// @target: es2015
const x: `foo` = "foo";

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
