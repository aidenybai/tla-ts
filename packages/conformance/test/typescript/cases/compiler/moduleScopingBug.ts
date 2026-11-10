/*---
description: Ported from TypeScript's tests/cases/compiler/moduleScopingBug.ts.
outcome: success
source: tests/cases/compiler/moduleScopingBug.ts
---*/
// @target: es2015
namespace M

{

    var outer: number;

    function f() {

        var inner = outer;   // Ok

    }

    class C {

        constructor() {
            var inner = outer;   // Ok
        }

    }

    namespace X {

        var inner = outer;   // Error: outer not visible

    }

}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
