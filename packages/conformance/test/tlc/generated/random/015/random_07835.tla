(*---
description: Evaluates a random function expression, seed 262, number 7835.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07835 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b12107 == IF (0 \in {2, 1, 3}) THEN Cardinality(2..1) ELSE (<<1>>).a IN Head(SubSeq(<<3, 1, 2>>, b12107, 7)) :> Len(SortSeq([[a |-> 1, b |-> TRUE] EXCEPT ![1] = 1], LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07835 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
