(*---
description: Evaluates a random int expression, seed 262, number 8345.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08345 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b12908 \in ((SUBSET {1} \ 1) \ ({1, 2} \ <<5, 6>>)) : ([a |-> b12908, b |-> FALSE] = (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE))) % (([<<5, 6>> EXCEPT ![2] = 0] @@ (7 :> 3)))[[([x \in Nat |-> x + 1] @@ <<5, 6>>) EXCEPT ![LET b12909 == -1 IN b12909] = Cardinality((1 :> 2))]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08345 failed.
    Attempted to check set membership in a tuple value.
---*)
