(*---
description: Evaluates a random function expression, seed 262, number 1589.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01589 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [1..2 -> {}] : TRUE) @@ ((CHOOSE b2535 \in {2 : b2536 \in {2, 1, 3}} : (\A b2537 \in Nat : TRUE)) :> (LET b2538 == -1 IN b2538 % (TRUE \div 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01589 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 49 of module random_01589
---*)
