(*---
description: Compares union, a UnionValue, with boolean_set, a SetEnumValue.
ref: tlc2/value/impl/UnionValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_union__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) = (BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_union__boolean_set failed.
    Attempted to check equality of integer 1 with non-integer:
    FALSE
---*)
