(*---
description: Evaluates a random bool expression, seed 262, number 4967.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04967 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((([x \in 1..2 |-> x] \ SUBSET {1}) \cap {7, -1})) \in {b7735 \in {b7736 \in (SUBSET {1} \cap 2..1) : ([a |-> 1] = [a |-> 1, b |-> TRUE])} : (\E b7737 \in {b7738 \in {x \in 1..3 : x > 1} : TRUE} : ([a |-> 1, b |-> TRUE] = [a |-> 1]))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04967 failed.
    Attempted to check if the value:
    7
    is an element of the function <<1, 2>>
---*)
