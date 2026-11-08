(*---
description: Evaluates a random bool expression, seed 262, number 403.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00403 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([(1 :> 2) EXCEPT ![0] = 1] @@ (FALSE \cap [a |-> 1])) = (CHOOSE f \in [{1} -> {1, 2}] : TRUE)) /\ ([a |-> [a |-> [x \in Nat |-> x + 1], b |-> TRUE], b |-> (<<3, 1, 2>> = <<5, 6>>)] = [(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + (0 - 2)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 21 to line 14, col 26 of module random_00403
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00403 failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    FALSE \cap [a |-> 1]
---*)
