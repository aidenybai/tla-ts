/*---
description: Ported from TypeScript's tests/cases/compiler/ambiguousCallsWhereReturnTypesAgree.ts.
outcome: success
source: tests/cases/compiler/ambiguousCallsWhereReturnTypesAgree.ts
---*/
// @target: es2015
class TestClass {
    public bar(x: string): void;
    public bar(x: string[]): void;
    public bar(x: any): void {
        
    }
 
    public foo(x: string): void;
    public foo(x: string[]): void;
    public foo(x: any): void {
        this.bar(x); // should not error
    }
}

class TestClass2 {
    public bar(x: string): number;
    public bar(x: string[]): number;
    public bar(x: any): number {
        return 0;
    }
 
    public foo(x: string): number;
    public foo(x: string[]): number;
    public foo(x: any): number {
        return this.bar(x); // should not error
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
