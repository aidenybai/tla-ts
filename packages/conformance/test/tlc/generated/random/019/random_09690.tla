(*---
description: Evaluates a random record expression, seed 262, number 9690.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09690 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (-IF TRUE THEN 1 ELSE -1), b |-> (([a |-> 1] = [a |-> 1, b |-> TRUE]) => ([a |-> 1] = [a |-> 1]))] EXCEPT !.a = @ + (([b15032 \in {1, 2} |-> <<3, 1, 2>>] @@ (FALSE => FALSE)))[([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]).a]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09690 failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    TRUE
---*)
