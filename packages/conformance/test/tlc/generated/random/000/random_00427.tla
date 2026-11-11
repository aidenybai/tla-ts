(*---
description: Evaluates a random record expression, seed 262, number 427.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00427 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-IF ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) THEN (CHOOSE b695 \in SUBSET {1} : FALSE) ELSE (7 - 1)), b |-> (([a |-> 2, b |-> FALSE] = [[a |-> 1] EXCEPT !.a = @ + 1]) => ((\A b696 \in 2..1 : FALSE) /\ (TRUE <=> TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00427 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 82 to line 14, col 115 of module random_00427
---*)
