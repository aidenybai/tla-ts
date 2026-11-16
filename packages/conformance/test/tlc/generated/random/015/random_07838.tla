(*---
description: Evaluates a random set expression, seed 262, number 7838.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07838 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ((CHOOSE b12111 \in {1} : FALSE) :> ([x \in 1..2 |-> x])[Nat]) \cup {b12112 \in ((1 \div 2147483647) .. ([a |-> 1, b |-> TRUE] \cap {1, 2})) : (({1} = 1..3) <=> (\E b12113 \in {1, 2} : FALSE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07838 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 54 of module random_07838
---*)
