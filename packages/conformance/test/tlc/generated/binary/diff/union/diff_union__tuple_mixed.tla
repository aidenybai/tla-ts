(*---
description: diff of union, a UnionValue, and tuple_mixed, a TupleValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_union__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) \ (<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module diff_union__tuple_mixed failed.
    Attempted to check set membership in a tuple value.
---*)
