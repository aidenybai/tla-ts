/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationSwitch.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationSwitch.ts
---*/
// @target: es2015
// @sourcemap: true
var x = 10;
switch (x) {
    case 5:
        x++;
        break;
    case 10:
        {
            x--;
            break;
        }
    default:
        x = x *10;
}
switch (x)
{
    case 5:
        x++;
        break;
    case 10:
        {
            x--;
            break;
        }
    default:
        {
            x = x * 10;
        }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
