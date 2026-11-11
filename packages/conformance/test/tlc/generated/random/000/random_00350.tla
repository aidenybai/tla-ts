(*---
description: Evaluates a random set expression, seed 262, number 350.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00350 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (([x \in Nat |-> x + 1] \in 1..3) <=> (<<3, 1, 2>> = [x \in Nat |-> x + 1])) THEN (CHOOSE b580 \in {0 : b581 \in {1, 2}} : (TRUE => FALSE)) ELSE ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a .. Cardinality({b582 \in (7 .. 0) : ([a |-> 1] = [a |-> 1])})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00350 failed.
    Attempted to check if the value:
    [x \in Nat |-> <expression line 14, col 37 to line 14, col 41 of module random_00350>]
    is in the integer interval 1..3
---*)
