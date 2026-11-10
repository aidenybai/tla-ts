/*---
description: Ported from TypeScript's tests/cases/compiler/resolveInterfaceNameWithSameLetDeclarationName2.ts.
outcome: success
source: tests/cases/compiler/resolveInterfaceNameWithSameLetDeclarationName2.ts
---*/
﻿// @target: es2015
interface foo { }
interface bar { }
let bar: bar | foo;
let foo: bar | foo;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
