(*---
description: Asks whether function_lazy is in set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_ints__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) \in ({2, 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_set_ints__function_lazy failed.
    Attempted to check equality of integer 2 with non-integer:
    [x \in Nat |-> <expression line 14, col 32 to line 14, col 32 of module in_set_ints__function_lazy>]
---*)
