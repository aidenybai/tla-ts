(*---
description: Evaluates a random int expression, seed 262, number 6289.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06289 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head([(Tail(<<>>) \o SortSeq(<<>>, LAMBDA p, q : p < q)) EXCEPT ![1] = ((CHOOSE b9674 \in 2..1 : TRUE) - Cardinality((1 :> 2)))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06289 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
