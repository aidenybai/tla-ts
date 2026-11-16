(*---
description: apply of cross, a SetOfTuplesValue, and set_map, a SetEnumValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_cross__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3})[{x + 1 : x \in 1..2}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_cross__set_map failed.
    A non-function (a cartesian product) was applied as a function.
    line 14, col 16 to line 14, col 52 of module apply_cross__set_map
---*)
