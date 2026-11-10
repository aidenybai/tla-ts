/*---
description: Ported from TypeScript's tests/cases/conformance/es7/exponentiationOperator/emitExponentiationOperator1.ts.
outcome: success
source: tests/cases/conformance/es7/exponentiationOperator/emitExponentiationOperator1.ts
---*/
﻿// @target: es5, es2015

1 ** -2;
1 ** 2;
(-1) ** 2
1 ** 2 ** 3;
1 ** 2 ** -3;
1 ** -(2 ** 3);
(-(1 ** 2)) ** 3;
(-(1 ** 2)) ** -3;

1 ** 2 + 3;
1 ** 2 - 3;
1 ** 2 * 3;
1 ** 2 / 3;
1 ** 2 % 3;

1 ** -2 + 3;
1 ** -2 - 3;
1 ** -2 * 3;
1 ** -2 / 3;
1 ** -2 % 3;

2 + 3 ** 3;
2 - 3 ** 3;
2 * 3 ** 3;
2 / 3 ** 3;
2 % 3 ** 3;

(2 + 3) ** 4;
(2 - 3) ** 4;
(2 * 3) ** 4;
(2 / 3) ** 4;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
