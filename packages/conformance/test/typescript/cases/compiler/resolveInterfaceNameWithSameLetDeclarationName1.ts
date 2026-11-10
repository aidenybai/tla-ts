/*---
description: Ported from TypeScript's tests/cases/compiler/resolveInterfaceNameWithSameLetDeclarationName1.ts.
outcome: success
source: tests/cases/compiler/resolveInterfaceNameWithSameLetDeclarationName1.ts
---*/
﻿// @target: es2015
interface bar { }
let bar: bar;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
