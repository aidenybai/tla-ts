(*---
description: Evaluates a random bool expression, seed 262, number 8393.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08393 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b12987 \in {b12988 \in {2147483647, <<3, 1, 2>>} : (1 = [a |-> 1, b |-> TRUE])} : ((<<5, 6>>)[b12987] = Cardinality({2, 1, 3}))) \/ (({1 : b12989 \in 1..3} \subseteq ({} \cap {x \in 1..3 : x > 1})) \/ ([<<3, 1, 2>> EXCEPT ![1] = 0] = (0 :> 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08393 failed.
    Attempted to compare the function <<3, 1, 2>> with the value:
    2147483647
---*)
