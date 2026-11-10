/*---
description: Ported from TypeScript's tests/cases/conformance/es6/spread/iteratorSpreadInArray2.ts.
outcome: throws
source: tests/cases/conformance/es6/spread/iteratorSpreadInArray2.ts
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

class NumberIterator {
    next() {
        return {
            value: 0,
            done: false
        };
    }

    [Symbol.iterator]() {
        return this;
    }
}

var array = [...new NumberIterator, ...new SymbolIterator];

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
