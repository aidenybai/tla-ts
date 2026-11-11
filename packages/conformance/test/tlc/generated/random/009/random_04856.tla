(*---
description: Evaluates a random bool expression, seed 262, number 4856.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04856 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) = [a |-> LET b7570 == 0 IN b7570, b |-> (2147483647 \in {1, 2})]) <=> ((({1, 2} \cap 1..3) = ({x \in 1..3 : x > 1} \ SUBSET {1})) <=> ((0 \in 1..3) => (2147483647 < 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04856 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
