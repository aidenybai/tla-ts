(*---
description: Evaluates a random int expression, seed 262, number 6758.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06758 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = Len({2, 1, 3})]) + CASE (~(-1 < 3)) -> ((7 \div 2) + ([x \in 1..2 |-> x])[0]) [] OTHER -> Cardinality(([a |-> 1, b |-> TRUE] \cup {1, 2}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06758 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    {1, 2, 3}
---*)
