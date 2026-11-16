(*---
description: apply of cross, a SetOfTuplesValue, and int_minimum, a IntValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_cross__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3})[(-2147483647 - 1)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_cross__int_minimum failed.
    A non-function (a cartesian product) was applied as a function.
    line 14, col 16 to line 14, col 49 of module apply_cross__int_minimum
---*)
