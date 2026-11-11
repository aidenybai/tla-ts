(*---
description: Evaluates a random bool expression, seed 262, number 1679.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01679 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x])[-1] = LET b2676 == 3 IN b2676) /\ (({1} = 2..1) /\ {0, 0})) /\ ((\E b2677 \in {b2678 \in {} : TRUE} : (~<<5, 6>>)) <=> ([[a |-> 1] EXCEPT !.a = @ + 2] = [[a |-> 1] EXCEPT !.a = @ + -1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01679 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)
