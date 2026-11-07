(*---
description: Evaluates a random bool expression, seed 262, number 3056.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03056 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((\E b4857 \in 1..3 : FALSE) \/ (<<1>> = [x \in 1..2 |-> x])) <=> (\A b4858 \in {-1, 3} : ([a |-> 1, b |-> TRUE] = [a |-> 1]))) <=> (([(1 :> 2) EXCEPT ![2] = 0] = ([x \in 1..2 |-> x] @@ (1 :> 2))) \/ (([a |-> 1, b |-> TRUE] = [a |-> 1]) \/ (TRUE \/ FALSE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 154 to line 14, col 159 of module random_03056
    | TRUE
---*)
