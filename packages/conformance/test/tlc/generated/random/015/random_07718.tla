(*---
description: Evaluates a random bool expression, seed 262, number 7718.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07718 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : 1..2] : TRUE) = [[a |-> (1 \div 3), b |-> (<<>> = [x \in 1..2 |-> x])] EXCEPT !.a = ((~FALSE) % (CHOOSE b11906 \in {} : TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07718 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 133 to line 14, col 159 of module random_07718
---*)
