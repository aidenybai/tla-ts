(*---
description: Evaluates a random bool expression, seed 262, number 3573.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03573 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(([x \in Nat |-> x + 1])[2] * CASE TRUE -> 3 [] OTHER -> 1)) < ((CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE))[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] EXCEPT !.a = ([a |-> 1]).a]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03573 failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> 1, b |-> TRUE]
---*)
