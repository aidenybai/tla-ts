/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMap-Comments2.ts.
outcome: success
source: tests/cases/compiler/sourceMap-Comments2.ts
---*/
// @target: ES5, ES2015
// @sourcemap: true
function foo(str: string, num: number): void {
    return;
}

/**
 * some sort of block quote
 */
function bar(str: string, num: number): void {
    return;
}

// some sort of comment
function baz(str: string, num: number): void {
    return;
}

function qat(str: string, num: number): void {
    return;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
