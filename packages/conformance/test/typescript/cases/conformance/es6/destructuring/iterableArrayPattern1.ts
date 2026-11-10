/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/iterableArrayPattern1.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/iterableArrayPattern1.ts
---*/
//@target: ES6
class SymbolIterator {
    next() {
        return {
            value: Symbol(),
            done: false
        };
    }

    [Symbol.iterator]() {
        return this;
    }
}

var [a, b] = new SymbolIterator;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
