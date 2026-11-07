(*---
description: Evaluates a random set expression, seed 262, number 6160.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06160 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]).a % CASE (TRUE => TRUE) -> Cardinality({1, 2}) [] OTHER -> (1 + 3)), ((CHOOSE f \in [{1} -> {}] : TRUE))[([b9478 \in Nat |-> 1])[(-2147483647)]]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06160 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 139 to line 14, col 169 of module random_06160
---*)
