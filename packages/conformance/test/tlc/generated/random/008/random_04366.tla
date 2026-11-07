(*---
description: Evaluates a random bool expression, seed 262, number 4366.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04366 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {(-1 .. 3), UNION {{2, 1, 3}, {x \in 1..3 : x > 1}}} \ {Head(<<3, 1, 2>>) : b6881 \in {b6882 \in {} : SUBSET {1}}}) = LET b6883 == (CHOOSE b6884 \in [(1 :> 2) EXCEPT ![1] = 7] : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) IN Cardinality((2..1 \cup 2..1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04366 failed.
    Attempted to check equality of the set {-1, 0, 1, 2, 3} with the value:
    0
---*)
