/*---
description: Ported from TypeScript's tests/cases/compiler/nestedBlockScopedBindings1.ts.
outcome: success
source: tests/cases/compiler/nestedBlockScopedBindings1.ts
---*/
// @target: es2015
function a0() {
    {
        let x = 1;
    }
    {
        let x = 1;
    }
}

function a1() {
    {
        let x;
    }
    {
        let x = 1;
    }
}

function a2() {
    {
        let x = 1;
    }
    {
        let x;
    }
}

function a3() {
    {
        let x = 1;
    }
    switch (1) {
        case 1:
            let x;
            break;
    }
}


function a4() {
    {
        let x;
    }
    switch (1) {
        case 1:
            let x = 1;
            break;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
