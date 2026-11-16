(*---
description: Evaluates a random function expression, seed 262, number 8135.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08135 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \ {1}] : TRUE) @@ ((CHOOSE b12567 \in (2 .. -1) : ([x \in 1..2 |-> x] /\ TRUE)) :> IF {1, [a |-> 1, b |-> TRUE]} THEN LET b12568 == <<1, 2>> IN b12568 ELSE (0 \div 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08135 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 78 to line 14, col 135 of module random_08135
---*)
