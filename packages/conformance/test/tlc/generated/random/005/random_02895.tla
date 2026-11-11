(*---
description: Evaluates a random int expression, seed 262, number 2895.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02895 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SortSeq(SubSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), ((1 :> 2) @@ [x \in 1..2 |-> x]), (-1 * 2147483647)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02895 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<2, 2>>
---*)
