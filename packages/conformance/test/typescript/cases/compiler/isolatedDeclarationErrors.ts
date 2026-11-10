/*---
description: Ported from TypeScript's tests/cases/compiler/isolatedDeclarationErrors.ts.
outcome: success
source: tests/cases/compiler/isolatedDeclarationErrors.ts
---*/
// @declaration: true
// @isolatedDeclarations: true
// @target: ESNext

function errorOnAssignmentBelowDecl(): void {}
errorOnAssignmentBelowDecl.a = "";

const errorOnAssignmentBelow = (): void => {}
errorOnAssignmentBelow.a = "";

const errorOnMissingReturn = () => {}
errorOnMissingReturn.a = "";

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
