(*---
description: Compares function, a FcnRcdValue, with subset, a SubsetValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_function__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1, 2} |-> x * 2]) = (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_function__subset failed.
    Attempted to check equality of the function <<2, 4>> with the value:
    {{}, {1}, {2}, {1, 2}}
---*)
