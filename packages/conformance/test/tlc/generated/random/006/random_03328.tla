(*---
description: Evaluates a random seq expression, seed 262, number 3328.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03328 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(SubSeq([<<1, 2>> EXCEPT ![1] = -1], (2147483647 * 1), ([a |-> 1, b |-> TRUE]).a), Len(SubSeq(<<>>, 2147483647, <<>>)), Len(SortSeq(<<1>>, LAMBDA p, q : p < q))) EXCEPT ![1] = (((CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE))[IF TRUE THEN 2147483647 ELSE -1] % ([<<5, 6>> EXCEPT ![7] = 3] + (2147483647 + 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03328 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<>>
---*)
