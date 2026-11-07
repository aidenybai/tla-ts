(*---
description: cap of int_one, a IntValue, and union, a UnionValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_int_one__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) \cap (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_int_one__union failed.
    Attempted to check if the value:
    1
    is an element of the integer 1
---*)
