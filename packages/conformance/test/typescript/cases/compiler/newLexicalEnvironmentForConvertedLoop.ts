/*---
description: Ported from TypeScript's tests/cases/compiler/newLexicalEnvironmentForConvertedLoop.ts.
outcome: success
source: tests/cases/compiler/newLexicalEnvironmentForConvertedLoop.ts
---*/
// @target: es5, es2015
function baz(x: any) {
  return [[x, x]];
}

function foo(set: any) {
  for (const [value, i] of baz(set.values)) {
    const bar: any = [];
    (() => bar);

    set.values.push(...[]);
  }
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
