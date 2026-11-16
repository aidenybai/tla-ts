(*---
description: Evaluates a random bool expression, seed 262, number 6072.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06072 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b9351 == IF TRUE THEN 0 ELSE 7 IN Cardinality({2, 1, 3}) = ((CHOOSE b9352 \in 1..3 : TRUE) + Len(<<>>))) /\ (CASE (FALSE \/ FALSE) -> (CHOOSE b9353 \in {x \in 1..3 : x > 1} : FALSE) [] OTHER -> (2147483647 % 2147483647) < Head(([x \in Nat |-> x + 1] = FALSE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
