(*---
description: cap of cross, a SetOfTuplesValue, and set_cap, a SetCapValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_cross__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) \cap ({1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_cross__set_cap failed.
    Attempted to check if non-tuple
    2
    is in the set of tuples:
    {<<1, 3>>, <<2, 3>>}
---*)
