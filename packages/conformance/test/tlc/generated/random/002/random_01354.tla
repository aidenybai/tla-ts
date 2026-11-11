(*---
description: Evaluates a random function expression, seed 262, number 1354.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01354 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b2160 \in 2..1 : TRUE) - CASE [a |-> 1] -> [a |-> 1, b |-> TRUE] [] OTHER -> 7) * {Head(FALSE), (-1 % 3)}) :> Cardinality(([a |-> 0, b |-> FALSE] \ ([a |-> 1] \cup [x \in Nat |-> x + 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01354 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 47 of module random_01354
---*)
