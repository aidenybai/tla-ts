(*---
description: Compares cross, a SetOfTuplesValue, with function, a FcnRcdValue.
ref: tlc2/value/impl/SetOfTuplesValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_cross__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) = ([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_cross__function failed.
    Attempted to check equality of the set {<<1, 3>>, <<2, 3>>} with the value:
    <<2, 4>>
---*)
