(*---
description: Evaluates a random function expression, seed 262, number 5673.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05673 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [1..2 -> 2..1] : TRUE) @@ (IF (~TRUE) THEN ([a |-> 1]).a ELSE Head([x \in Nat |-> x + 1]) :> (\E b8749 \in {b8750 \in 2..1 : TRUE} : (SUBSET {1} \subseteq 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05673 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 51 of module random_05673
---*)
