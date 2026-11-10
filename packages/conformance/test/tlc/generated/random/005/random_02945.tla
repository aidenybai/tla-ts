(*---
description: Evaluates a random function expression, seed 262, number 2945.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02945 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((1 + 7) :> ([a |-> 1]).a) EXCEPT ![(-Head(<<1, 2>>))] = ((CHOOSE b4666 \in 1..3 : FALSE) + ([a |-> 1]).a)])[Cardinality((UNION {{x \in 1..3 : x > 1}, {1}} \cup DOMAIN <<5, 6>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 42 of module random_02945
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02945 failed.
    Attempted to apply function:
    (8 :> 1)
    to argument 3, which is not in the domain of the function.
---*)
