(*---
description: Evaluates a random seq expression, seed 262, number 3843.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03843 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append(SortSeq((1..3 = SUBSET {1}), LAMBDA p, q : p < q), IF (1 = Nat) THEN Cardinality({1}) ELSE Cardinality(1)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03843 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    FALSE
---*)
