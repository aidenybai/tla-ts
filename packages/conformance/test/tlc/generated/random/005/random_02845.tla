(*---
description: Evaluates a random seq expression, seed 262, number 2845.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02845 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(<<LET b4513 == -1 IN b4513, CASE TRUE -> 3 [] OTHER -> SUBSET {1}>>, LAMBDA p, q : p < q) \o SelectSeq([SubSeq(<<>>, TRUE, -1) EXCEPT ![1] = Cardinality(Nat)], LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02845 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    TRUE
---*)
