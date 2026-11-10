/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitDestructuring1.ts.
outcome: success
source: tests/cases/compiler/declarationEmitDestructuring1.ts
---*/
// @target: es2015
// @declaration: true
function foo([a, b, c]: [string, string, string]): void { }
function far([a, [b], [[c]]]: [number, boolean[], string[][]]): void { }
function bar({a1, b1, c1}: { a1: number, b1: boolean, c1: string }): void { }
function baz({a2, b2: {b1, c1}}: { a2: number, b2: { b1: boolean, c1: string } }): void { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
