/*---
description: Ported from TypeScript's tests/cases/conformance/interfaces/interfaceDeclarations/derivedInterfaceDoesNotHideBaseSignatures.ts.
outcome: success
source: tests/cases/conformance/interfaces/interfaceDeclarations/derivedInterfaceDoesNotHideBaseSignatures.ts
---*/
// @target: es2015
// Derived interfaces no longer hide signatures from base types, so these signatures are always compatible.
interface Base {
    (): string;
    new (x: string): number;
}

interface Derived extends Base {
    (): number;
    new (x: string): string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
