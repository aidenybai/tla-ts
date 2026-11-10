/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-ofStatements/ES5For-ofTypeCheck10.ts.
outcome: success
source: tests/cases/conformance/statements/for-ofStatements/ES5For-ofTypeCheck10.ts
---*/
//@target: ES5, ES2015

// In ES3/5, you cannot for...of over an arbitrary iterable.
class MyStringIterator {
    next() {
        return {
            done: true,
            value: ""
        };
    }
    [Symbol.iterator]() {
        return this;
    }
}

for (var v of new MyStringIterator) { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
