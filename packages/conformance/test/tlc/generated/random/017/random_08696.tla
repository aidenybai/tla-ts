(*---
description: Evaluates a random int expression, seed 262, number 8696.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08696 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head([<<7, 0>> EXCEPT ![1] = (3 \div 0)]) \div ((({x \in 1..3 : x > 1} :> -1))[Head(<<3, 1, 2>>)] + {Len(<<3, 1, 2>>) : b13461 \in DOMAIN [x \in Nat |-> x + 1]})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08696 failed.
    2179:0 The second argument of \div is 0.
---*)
