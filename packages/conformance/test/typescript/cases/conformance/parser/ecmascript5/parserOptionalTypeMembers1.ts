/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/parserOptionalTypeMembers1.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/parserOptionalTypeMembers1.ts
---*/
// @target: es2015
interface PropertyDescriptor2 {
    configurable?: boolean;
    enumerable?: boolean;
    value?: any;
    writable?: boolean;
    get?(): any;
    set?(v: any): void;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
