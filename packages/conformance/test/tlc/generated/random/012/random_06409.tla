(*---
description: Evaluates a random record expression, seed 262, number 6409.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06409 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (-[[x \in Nat |-> x + 1] EXCEPT !.a = 2147483647]), b |-> (([a |-> 1, b |-> TRUE] = [a |-> 1]) /\ (TRUE <=> TRUE))] EXCEPT !.a = @ + (CHOOSE b9858 \in {(b9859 % b9859) : b9859 \in (Nat \ SUBSET {1})} : ((CHOOSE b9860 \in SUBSET {1} : TRUE) \in {b9861 \in 1..3 : TRUE}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06409 failed.
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
---*)
