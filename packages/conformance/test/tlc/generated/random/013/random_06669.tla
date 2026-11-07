(*---
description: Evaluates a random bool expression, seed 262, number 6669.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06669 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((-1 % 0) \in UNION {1..3, FALSE}) -> ((CHOOSE b10225 \in [a |-> 1, b |-> TRUE] : [x \in Nat |-> x + 1]) \div (1 + 2147483647)) [] OTHER -> CASE {3, 3} -> Cardinality(SUBSET {1}) [] OTHER -> ([x \in Nat |-> x + 1])[-1] < ([a |-> (CHOOSE b10226 \in Nat : FALSE), b |-> (FALSE => TRUE)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
