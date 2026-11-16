(*---
description: Evaluates a random bool expression, seed 262, number 6470.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06470 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([SortSeq([a |-> 1], LAMBDA p, q : p < q) EXCEPT ![1] = (CHOOSE b9962 \in {1} : TRUE)] = (([x \in Nat |-> x + 1] @@ <<5, 6>>) @@ [<<5, 6>> EXCEPT ![-1] = 0])) \/ (([[a |-> 1] EXCEPT !.a = @ + -1] = (CHOOSE r \in [a : 2..1] : TRUE)) <=> ({1 : b9963 \in 1..3} = {-1, 2147483647}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06470 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> 1]
---*)
