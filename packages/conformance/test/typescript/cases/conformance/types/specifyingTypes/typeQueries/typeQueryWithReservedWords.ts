/*---
description: Ported from TypeScript's tests/cases/conformance/types/specifyingTypes/typeQueries/typeQueryWithReservedWords.ts.
outcome: success
source: tests/cases/conformance/types/specifyingTypes/typeQueries/typeQueryWithReservedWords.ts
---*/
// @target: es2015
class Controller {
    create() {
    }
    delete() {
    }
    var() {
    }
}

interface IScope {
    create: typeof Controller.prototype.create;  
    delete: typeof Controller.prototype.delete;  // Should not error
    var: typeof Controller.prototype.var;        // Should not error
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
