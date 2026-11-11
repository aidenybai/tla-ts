(*---
description: Evaluates a random set expression, seed 262, number 232.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00232 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((-1) \div ([x \in Nat |-> x + 1])[7]) - (CHOOSE b378 \in {b379 \in {2, 1, 3} : TRUE} : (<<3, 1, 2>> = [x \in Nat |-> x + 1]))), ([[<<5, 6>> EXCEPT ![7] = 2147483647] EXCEPT ![([a |-> 1, b |-> TRUE]).a] = (-1 + TRUE)])[((1 :> 0))[(2 + 2147483647)]]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00232 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
