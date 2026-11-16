(*---
description: Evaluates a random bool expression, seed 262, number 950.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00950 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE f \in [{1, 2} -> {}] : TRUE))[([x \in Nat |-> x + 1])[7]] < (Len(<<3, 1, 2>>) + (7 * [x \in 1..2 |-> x]))) \/ (((<<5, 6>>)[3] \in (1 .. 0)) \/ ((\A b1528 \in {} : <<1>>) \subseteq ({x \in 1..3 : x > 1} \cap {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00950 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 53 of module random_00950
---*)
