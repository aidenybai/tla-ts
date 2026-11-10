(*---
description: Evaluates a random seq expression, seed 262, number 4240.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04240 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(CHOOSE b6668 \in {([a |-> 1]).a : b6669 \in {2 : b6670 \in {2, 1, 3}}} : ([a |-> b6668, b |-> FALSE] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b6668])), Cardinality((CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04240 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 168 of module random_04240
---*)
