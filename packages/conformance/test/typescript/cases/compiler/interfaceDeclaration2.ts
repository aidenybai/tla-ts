/*---
description: Ported from TypeScript's tests/cases/compiler/interfaceDeclaration2.ts.
outcome: success
source: tests/cases/compiler/interfaceDeclaration2.ts
---*/
// @target: es2015
interface I1 { }
namespace I1 { }

interface I2 { }
class I2 { }

interface I3 { }
function I3() { }

interface I4 { }
var I4:number;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
