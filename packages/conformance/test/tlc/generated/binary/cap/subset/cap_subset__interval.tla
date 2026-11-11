(*---
description: cap of subset, a SubsetValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_subset__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \cap (1..3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_subset__interval failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}, {2}, {1, 2}}
---*)
