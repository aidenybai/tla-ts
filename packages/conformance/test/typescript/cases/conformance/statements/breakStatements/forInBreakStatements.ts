/*---
description: Ported from TypeScript's tests/cases/conformance/statements/breakStatements/forInBreakStatements.ts.
outcome: success
source: tests/cases/conformance/statements/breakStatements/forInBreakStatements.ts
---*/
// @target: es2015
// @strict: false
// @allowUnusedLabels: true

for(var x in {}) {
    break;
}

ONE:
for(var x in {}) {
    break ONE;
}

TWO:
THREE:
for(var x in {}) {
    break THREE;
}

FOUR:
for(var x in {}) {
    FIVE:
    for(var x in {}) {
        break FOUR;
    }
}

for(var x in {}) {
    SIX:
    for(var x in {}) break SIX;
}

SEVEN:
for (var x in {}) for (var x in {}) for (var x in {}) break SEVEN;

EIGHT:
for (var x in {}){
    var fn = function () { }
    break EIGHT;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
