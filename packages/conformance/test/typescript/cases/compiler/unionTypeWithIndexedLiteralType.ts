/*---
description: Ported from TypeScript's tests/cases/compiler/unionTypeWithIndexedLiteralType.ts.
outcome: success
source: tests/cases/compiler/unionTypeWithIndexedLiteralType.ts
---*/
// @target: es2015
interface I { x: number; }
interface Idx { [index: string]: U; }
type U = Idx | I | "lit";
const u: U = { x: "lit" };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
