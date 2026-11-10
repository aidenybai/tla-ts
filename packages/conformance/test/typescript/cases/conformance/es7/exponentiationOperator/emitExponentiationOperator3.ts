/*---
description: Ported from TypeScript's tests/cases/conformance/es7/exponentiationOperator/emitExponentiationOperator3.ts.
outcome: success
source: tests/cases/conformance/es7/exponentiationOperator/emitExponentiationOperator3.ts
---*/
﻿// @target:es5, es2015

var temp = 10;

(-++temp) ** 3;
(+--temp) ** 3;
(-temp++) ** 3;
(+temp--) ** 3;
(-(1 ** ++temp)) ** 3;
(-(1 ** --temp)) ** 3;
(-(1 ** temp++)) ** 3;
(-(1 ** temp--)) ** 3;

(-3) ** temp++;
(-3) ** temp--;
(-3) ** ++temp;
(-3) ** --temp;
(+3) ** temp++;
(+3) ** temp--;
(+3) ** ++temp;
(+3) ** --temp;
(-3) ** temp++ ** 2;
(-3) ** temp-- ** 2;
(-3) ** ++temp ** 2;
(-3) ** --temp ** 2;
(+3) ** temp++ ** 2;
(+3) ** temp-- ** 2;
(+3) ** ++temp ** 2;
(+3) ** --temp ** 2;

3 ** -temp++;
3 ** -temp--;
3 ** -++temp;
3 ** +--temp;
3 ** (-temp++) ** 2;
3 ** (-temp--) ** 2;
3 ** (+temp++) ** 2;
3 ** (+temp--) ** 2;
3 ** (-++temp) ** 2;
3 ** (+--temp) ** 2;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
