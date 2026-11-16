(*---
description: Evaluates a random bool expression, seed 262, number 5244.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05244 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[a |-> {1}, b |-> TRUE] EXCEPT !.a = Cardinality({x \in 1..3 : x > 1})] EXCEPT !.a = @ + Head(SubSeq(<<1>>, <<3, 1, 2>>, -1))] = (CHOOSE r \in [a : 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05244 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<3, 1, 2>>
---*)
