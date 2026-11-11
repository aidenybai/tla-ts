(*---
description: apply of int_minimum, a IntValue, and set_mixed, a SetEnumValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_int_minimum__set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1))[{1, "a"}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_int_minimum__set_mixed failed.
    A non-function (an integer) was applied as a function.
    line 14, col 16 to line 14, col 44 of module apply_int_minimum__set_mixed
---*)
