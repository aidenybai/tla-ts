/*---
description: Ported from TypeScript's tests/cases/compiler/switchFallThroughs.ts.
outcome: success
source: tests/cases/compiler/switchFallThroughs.ts
---*/
// @target: es2015
function R1(index: number) {
    switch (index) {
        case 0:
        case 1:
        case 2:
            var a = 'a';
            return a;
        case 3:
        case 4: {
            return 'b';
        }
		case 5:
		default:
			return 'c';
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
