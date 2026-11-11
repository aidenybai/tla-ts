(*---
description: Compares union, a UnionValue, with cross, a SetOfTuplesValue.
ref: tlc2/value/impl/UnionValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_union__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) = ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_union__cross failed.
    Attempted to check equality of integer 1 with non-integer:
    <<1, 3>>
---*)
