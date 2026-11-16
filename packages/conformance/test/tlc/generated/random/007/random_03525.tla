(*---
description: Evaluates a random int expression, seed 262, number 3525.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03525 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (-1 * 2147483647) -> (CHOOSE b5571 \in 2..1 : FALSE) [] OTHER -> (-1 + 0) % CASE (FALSE => TRUE) -> (2147483647 * 7) [] OTHER -> IF FALSE THEN 3 ELSE -1) * ((Cardinality({}) * (-1 - -1)) % (-Head([a |-> 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03525 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. line 14, col 24 to line 14, col 38 of module random_03525
---*)
