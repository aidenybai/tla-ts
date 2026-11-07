(*---
description: Evaluates a random set expression, seed 262, number 7637.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07637 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((CHOOSE r \in [a : 1..2] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]) -> IF (FALSE => TRUE) THEN (7 + 0) ELSE (-0) [] OTHER -> IF (<<>> = <<5, 6>>) THEN (0 % 3) ELSE (3 - 1) .. Cardinality(UNION {DOMAIN <<5, 6>>, {b11749 : b11749 \in {1, 2}}})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2..2"
---*)
