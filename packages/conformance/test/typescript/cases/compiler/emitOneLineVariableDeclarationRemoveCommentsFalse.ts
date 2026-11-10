/*---
description: Ported from TypeScript's tests/cases/compiler/emitOneLineVariableDeclarationRemoveCommentsFalse.ts.
outcome: throws
source: tests/cases/compiler/emitOneLineVariableDeclarationRemoveCommentsFalse.ts
---*/
// @target: es2015
// @removeComments: false

let a = /*[[${something}]]*/ {};
let b: any = /*[[${something}]]*/ {};
let c: { hoge: boolean } = /*[[${something}]]*/ { hoge: true };
let d: any  /*[[${something}]]*/ = {};
let e/*[[${something}]]*/: any   = {};
let f = /* comment1 */ d(e);
let g: any = /* comment2 */ d(e);

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
