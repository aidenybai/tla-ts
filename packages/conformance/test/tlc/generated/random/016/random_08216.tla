(*---
description: Evaluates a random function expression, seed 262, number 8216.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08216 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((CHOOSE f \in [2..1 -> {0} \cup {1}] : TRUE) @@ (-1 :> 3)) @@ (CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE)) EXCEPT ![Cardinality(((1 = 2) <=> ({x \in 1..3 : x > 1} = 1..3)))] = (IF (FALSE <=> TRUE) THEN (0 * {1, 2}) ELSE ([a |-> 1, b |-> TRUE]).a + CASE (TRUE \/ TRUE) -> ([x \in 1..2 |-> x])[2] [] OTHER -> Head([x \in 1..2 |-> x]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08216 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 82 to line 14, col 120 of module random_08216
---*)
