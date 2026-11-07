(*---
description: Evaluates a random bool expression, seed 262, number 981.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00981 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head([SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = {b1575 : b1575 \in 1}]) = (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2]).a * (({2, 1, 3} - 2147483647) + (-2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00981 failed.
    TLC encountered a non-enumerable quantifier bound
    1.
    1
---*)
