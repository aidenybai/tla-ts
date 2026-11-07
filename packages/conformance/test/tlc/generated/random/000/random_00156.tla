(*---
description: Evaluates a random bool expression, seed 262, number 156.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00156 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a = ([[a |-> 1] EXCEPT !.a = @ + 3]).a) \/ (\A b238 \in {b239 \in {7, 7} : ([a |-> 1] = [a |-> 1])} : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] = [a |-> {2, 1, 3}, b |-> TRUE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00156 failed.
    Attempted to check equality of integer 4 with non-integer:
    {1, 2, 3}
---*)
