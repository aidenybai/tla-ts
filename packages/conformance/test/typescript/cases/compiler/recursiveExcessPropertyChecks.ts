/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveExcessPropertyChecks.ts.
outcome: success
source: tests/cases/compiler/recursiveExcessPropertyChecks.ts
---*/
// @target: es2015
// @strict: true

// Repro from #35804

interface ITreeItem {    
  Parent?: this;
}

type NodeWithId = ITreeItem & { Id?: number };

function getMaxId(items: NodeWithId[]) {
}

const nodes = [] as ITreeItem[];
getMaxId(nodes);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
