/*---
description: Ported from TypeScript's tests/cases/conformance/statements/continueStatements/forInContinueStatements.ts.
outcome: success
source: tests/cases/conformance/statements/continueStatements/forInContinueStatements.ts
---*/
// @target: es2015
// @strict: false
// @allowUnusedLabels: true

for(var x in {}) {
    continue;
}

ONE:
for(var x in {}) {
    continue ONE;
}

TWO:
THREE:
for(var x in {}) {
    continue THREE;
}

FOUR:
for(var x in {}) {
    FIVE:
    for(var x in {}) {
        continue FOUR;
    }
}

for(var x in {}) {
    SIX:
    for(var x in {}) continue SIX;
}

SEVEN:
for (var x in {}) for (var x in {}) for (var x in {}) continue SEVEN;

EIGHT:
for (var x in {}){
    var fn = function () { }
    continue EIGHT;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
