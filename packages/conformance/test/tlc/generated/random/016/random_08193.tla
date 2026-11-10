(*---
description: Evaluates a random int expression, seed 262, number 8193.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08193 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(SortSeq(SubSeq(<<1>>, [a |-> 1], TRUE), LAMBDA p, q : p < q), LAMBDA p, q : p < q) % (((CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE))[LET b12671 == 0 IN 3] - ((0 % -1) \div (CHOOSE b12672 \in SUBSET {1} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08193 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1]
---*)
