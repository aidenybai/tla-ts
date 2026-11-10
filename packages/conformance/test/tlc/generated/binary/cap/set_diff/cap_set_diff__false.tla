(*---
description: cap of set_diff, a SetDiffValue, and false, a BoolValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_diff__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) \cap (FALSE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_set_diff__false failed.
    Attempted to check if the value:
    1
    is an element of the boolean FALSE
---*)
