(*---
description: cap of set_filter, a SetPredValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_filter__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \cap (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_set_filter__subset failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}, {2}, {1, 2}}
---*)
