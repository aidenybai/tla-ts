(*---
description: Evaluates a random seq expression, seed 262, number 5357.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05357 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SortSeq(SubSeq(<<1, -1>>, SelectSeq(<<1>>, LAMBDA e : e > 0), LET b8286 == -1 IN b8286), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05357 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1>>
---*)
