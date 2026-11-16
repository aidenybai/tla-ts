(*---
description: Evaluates a random int expression, seed 262, number 189.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00189 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> ((1 :> 2))[0], b |-> (7 < 1)]).a + (Cardinality((FALSE .. FALSE)) * (LET b308 == 3 IN b308 + (CHOOSE b309 \in 1..3 : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00189 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
