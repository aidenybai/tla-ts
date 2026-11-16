(*---
description: Evaluates a random set expression, seed 262, number 4190.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04190 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(IF FALSE THEN b6594 ELSE b6594 + (CHOOSE b6595 \in {2, 1, 3} : TRUE)) : b6594 \in ((-1 * 0) - (CHOOSE b6596 \in {1} : FALSE))} \ DOMAIN (CHOOSE f \in [2..1 -> 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04190 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 114 to line 14, col 141 of module random_04190
---*)
