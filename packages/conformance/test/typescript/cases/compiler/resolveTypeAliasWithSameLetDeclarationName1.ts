/*---
description: Ported from TypeScript's tests/cases/compiler/resolveTypeAliasWithSameLetDeclarationName1.ts.
outcome: success
source: tests/cases/compiler/resolveTypeAliasWithSameLetDeclarationName1.ts
---*/
﻿// @target: es2015
class C { }
type baz = C;
let baz: baz;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
