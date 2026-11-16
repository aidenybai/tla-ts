(*---
description: Evaluates a random bool expression, seed 262, number 4811.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04811 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(Head([[a |-> 1] EXCEPT !.a = @ + -1]) = ((0 \div 2) * (3 % 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04811 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 0]
---*)
