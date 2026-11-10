/*---
description: Ported from TypeScript's tests/cases/compiler/indexer.ts.
outcome: success
source: tests/cases/compiler/indexer.ts
---*/
// @target: es2015
interface JQueryElement {
    id:string;
}

interface JQuery {
    [n:number]:JQueryElement;
}

var jq:JQuery={ 0: { id : "a" }, 1: { id : "b" } };
jq[0].id;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
