(*---
description: Evaluates a random int expression, seed 262, number 1686.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01686 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b2691 == Head(<<(2 + 1), (CHOOSE b2692 \in 1..3 : TRUE)>>) IN Tail(SortSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01686 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
