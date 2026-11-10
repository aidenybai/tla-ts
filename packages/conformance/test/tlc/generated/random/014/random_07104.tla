(*---
description: Evaluates a random seq expression, seed 262, number 7104.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07104 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([[[a |-> 0, b |-> <<1, 2>>] EXCEPT !.a = ([x \in 1..2 |-> x])[2]] EXCEPT !.a = @ + (([x \in 1..2 |-> x])[1] * (0 + 3))], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07104 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> 5, b |-> <<1, 2>>]
---*)
