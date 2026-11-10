/*---
description: Ported from TypeScript's tests/cases/compiler/signatureOverloadsWithComments.ts.
outcome: success
source: tests/cases/compiler/signatureOverloadsWithComments.ts
---*/
// @target: es2015
// @declaration: true
// @emitDeclarationOnly: true

/**
 * Docs
 */
function Foo() {
    return class Bar {
        /**
         * comment 1
         */
        foo(bar: string): void;
        /**
         * @deprecated This signature is deprecated
         *
         * comment 2
         */
        foo(): string;
        foo(bar?: string): string | void {
            return 'hi'
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
