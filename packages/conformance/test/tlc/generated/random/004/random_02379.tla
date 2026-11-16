(*---
description: Evaluates a random set expression, seed 262, number 2379.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02379 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b3773 \in (1 .. 1) : ({2, 1, 3} \subseteq {1, 2})) \div Len(SubSeq(<<1, 2>>, 0, -1))) .. (Len(SortSeq(TRUE, LAMBDA p, q : p < q)) \div ((0 - 2) * (0 * 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02379 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 74 of module random_02379
---*)
