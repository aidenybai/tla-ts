(*---
description: Evaluates a random function expression, seed 262, number 7423.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07423 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE f \in [1..2 -> {}] : TRUE) EXCEPT ![IF (3 = -1) THEN Head(<<1, 2>>) ELSE ([a |-> 1, b |-> TRUE]).a] = (-(-3))] EXCEPT ![IF (([x \in Nat |-> x + 1])[2147483647] < ([a |-> 1, b |-> TRUE] * <<1>>)) THEN IF (~FALSE) THEN (TRUE)[2147483647] ELSE Len(<<1>>) ELSE ((CHOOSE b11433 \in {} : [a |-> 1, b |-> TRUE]) % (CHOOSE b11434 \in {2, 1, 3} : FALSE))] = (-((3 * 3) + LET b11435 == 2 IN -1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07423 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 50 of module random_07423
---*)
