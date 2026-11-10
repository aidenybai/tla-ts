/*---
description: Ported from TypeScript's tests/cases/compiler/parameterDestructuringObjectLiteral.ts.
outcome: success
source: tests/cases/compiler/parameterDestructuringObjectLiteral.ts
---*/
// @target: es2015
// @declaration: true

// Repro from #22644

const fn1 = (options: { headers?: {} }) => { };
fn1({ headers: { foo: 1 } });

const fn2 = ({ headers = {} }) => { };
fn2({ headers: { foo: 1 } });

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
