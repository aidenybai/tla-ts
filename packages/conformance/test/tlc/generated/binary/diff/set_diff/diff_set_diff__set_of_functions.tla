(*---
description: diff of set_diff, a SetDiffValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_diff__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) \ ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module diff_set_diff__set_of_functions failed.
    Attempted to check if 
    1
    which is not a TLC function value, is in the set of functions:
    {<<2>>, <<3>>}
---*)
