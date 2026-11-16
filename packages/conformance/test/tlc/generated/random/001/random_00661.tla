(*---
description: Evaluates a random set expression, seed 262, number 661.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00661 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((-1 + 2147483647) * Len(<<>>)) :> ((-1 * 3) + ([a |-> 1, b |-> TRUE]).a)), LET b1101 == ((-1) * (1 \div 3)) IN (CHOOSE b1102 \in {b1103 \in {} : TRUE} : (\A b1104 \in 1..3 : TRUE))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00661 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 131 to line 14, col 197 of module random_00661
---*)
