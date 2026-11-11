(*---
description: Evaluates a random set expression, seed 262, number 2481.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02481 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE r \in [a : {}] : TRUE), (LET b3901 == (0 \div 1) IN (1 * b3901) % CASE (FALSE => TRUE) -> ((1 :> 2))[2147483647] [] OTHER -> Cardinality({}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02481 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 45 of module random_02481
---*)
