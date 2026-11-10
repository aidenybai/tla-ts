(*---
description: Evaluates a random int expression, seed 262, number 4130.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04130 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((2147483647 % 2147483647) + (CHOOSE f \in [{1, 2} -> 2..1] : TRUE)) < ([b6494 \in {1} |-> 2] - (2147483647 * 2))) -> Cardinality((({1} \ {2, 1, 3}) \ (1..3 \cup 2..1))) [] OTHER -> (-CASE (FALSE \in 1..3) -> Head(<<>>) [] OTHER -> IF FALSE THEN -1 ELSE -1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04130 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 52 to line 14, col 87 of module random_04130
---*)
