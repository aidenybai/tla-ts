(*---
description: apply of union, a UnionValue, and subset, a SubsetValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_union__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}})[SUBSET {1, 2}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_union__subset failed.
    A non-function (a set of the form {e1, ... ,eN}) was applied as a function.
    line 14, col 16 to line 14, col 48 of module apply_union__subset
---*)
