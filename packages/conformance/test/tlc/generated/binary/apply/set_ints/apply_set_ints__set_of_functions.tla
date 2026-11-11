(*---
description: apply of set_ints, a SetEnumValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_set_ints__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1})[[{1} -> {2, 3}]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_set_ints__set_of_functions failed.
    A non-function (a set of the form {e1, ... ,eN}) was applied as a function.
    line 14, col 16 to line 14, col 40 of module apply_set_ints__set_of_functions
---*)
