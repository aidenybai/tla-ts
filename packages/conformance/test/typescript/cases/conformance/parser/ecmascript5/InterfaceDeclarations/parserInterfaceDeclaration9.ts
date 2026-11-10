/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/InterfaceDeclarations/parserInterfaceDeclaration9.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/InterfaceDeclarations/parserInterfaceDeclaration9.ts
---*/
// @target: es2015
interface I1 {
    get foo(): number,
    set foo(value: number),
}

interface I2 {
    get foo(): number;
    set foo(value: number);
}

interface I3 {
    get foo(): number
    set foo(value: number)
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
