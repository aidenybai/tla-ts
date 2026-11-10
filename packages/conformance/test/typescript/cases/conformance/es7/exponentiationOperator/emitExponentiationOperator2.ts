/*---
description: Ported from TypeScript's tests/cases/conformance/es7/exponentiationOperator/emitExponentiationOperator2.ts.
outcome: success
source: tests/cases/conformance/es7/exponentiationOperator/emitExponentiationOperator2.ts
---*/
﻿// @target:es5, es2015

var temp = 10;

++temp ** 3;
--temp ** 3;
temp++ ** 3;
temp-- ** 3;
--temp + temp ** 3;
--temp - temp ** 3;
--temp * temp ** 3;
--temp / temp ** 3;
--temp % temp ** 3;
temp-- ** 3;
temp++ ** 3;
temp-- ** -temp;
temp++ ** +temp;

temp-- + temp ** 3;
temp-- - temp ** 3;
temp-- * temp ** 3;
temp-- / temp ** 3;
temp-- % temp ** 3;

--temp + 2 ** 3;
--temp - 2 ** 3;
--temp * 2 ** 3;
--temp / 2 ** 3;
--temp % 2 ** 3;

++temp + 2 ** 3;
++temp - 2 ** 3;
++temp * 2 ** 3;
++temp / 2 ** 3;

3 ** ++temp;
3 ** --temp;
3 ** temp++;
3 ** temp--;

3 ** ++temp ** 2;
3 ** --temp ** 2;
3 ** temp++ ** 2;
3 ** temp-- ** 2;

3 ** ++temp + 2;
3 ** ++temp - 2;
3 ** ++temp * 2;
3 ** ++temp / 2;
3 ** ++temp % 2;

3 ** --temp + 2;
3 ** --temp - 2;
3 ** --temp * 2;
3 ** --temp / 2;
3 ** --temp % 2;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
