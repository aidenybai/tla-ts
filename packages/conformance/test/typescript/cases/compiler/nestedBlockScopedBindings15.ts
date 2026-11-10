/*---
description: Ported from TypeScript's tests/cases/compiler/nestedBlockScopedBindings15.ts.
outcome: success
source: tests/cases/compiler/nestedBlockScopedBindings15.ts
---*/
// @target: es2015
for (; false;) {
    {
        let x;
        () => x;
    }
}

for (; false;) {
    {
        let y;
        y = 1;
    }
}

for (; false;) {
    switch (1){
        case 1:
            let z0;
            () => z0;
            break;
    }
}

for (; false;) {
    switch (1){
        case 1:
            let z;
            z = 1;
            break;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
