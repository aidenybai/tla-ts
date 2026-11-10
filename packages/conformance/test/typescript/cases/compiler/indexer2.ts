/*---
description: Ported from TypeScript's tests/cases/compiler/indexer2.ts.
outcome: success
source: tests/cases/compiler/indexer2.ts
---*/
// @target: es2015
interface IHeapObjectProperty {}
interface IDirectChildrenMap { 
        hasOwnProperty(objectId: number) : boolean; 
        [objectId: number] : IHeapObjectProperty[]; 
}    
var directChildrenMap = <IDirectChildrenMap>{};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
