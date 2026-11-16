(*---
description: Evaluates a random int expression, seed 262, number 2396.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02396 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE f \in [2..1 -> {}] : TRUE) EXCEPT !.a = IF 1..3 THEN 2 ELSE 1]).a % (((~FALSE) \/ (\A b3794 \in {} : TRUE)) \div ((2 \div 7) \div (CHOOSE b3795 \in {} : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02396 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
