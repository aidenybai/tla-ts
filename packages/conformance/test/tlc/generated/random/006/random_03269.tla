(*---
description: Evaluates a random record expression, seed 262, number 3269.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03269 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((3 - 0) \div CASE TRUE -> 2147483647 [] OTHER -> 1), b |-> ((CHOOSE b5202 \in {} : FALSE) = CASE FALSE -> 7 [] OTHER -> -1)] EXCEPT !.a = ((CHOOSE f \in [{} -> {1, 2}] : TRUE) \div ((<<5, 6>>)[-1] * (1 - 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03269 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 86 to line 14, col 112 of module random_03269
---*)
