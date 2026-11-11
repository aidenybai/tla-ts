(*---
description: Evaluates a random int expression, seed 262, number 7452.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07452 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((CHOOSE b11487 \in {} : FALSE) .. ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1])) = {Head(<<>>) : b11488 \in {2, 2147483647}}) THEN (LET b11489 == (2 % 0) IN (CHOOSE b11490 \in {} : TRUE) \div CASE (FALSE \/ TRUE) -> Cardinality(2..1) [] OTHER -> (2 \div 1..3)) ELSE ([a |-> IF TRUE THEN 7 ELSE -1, b |-> (1 \in {x \in 1..3 : x > 1})]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07452 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 22 to line 14, col 49 of module random_07452
---*)
