(*---
description: Evaluates a random bool expression, seed 262, number 7190.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07190 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<1, 2>>) \div (7 - -1)) \div Cardinality(({2, 1, 3} \cap 2..1))) \in {(CHOOSE b11046 \in (2..1 \cap {1, 2}) : (\E b11047 \in {1} : TRUE)), (([x \in Nat |-> x + 1] @@ (1 :> 2)))[Head(<<1>>)]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07190 failed.
    2179:0 The second argument of \div is 0.
---*)
