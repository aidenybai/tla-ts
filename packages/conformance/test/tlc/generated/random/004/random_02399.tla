(*---
description: Evaluates a random bool expression, seed 262, number 2399.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02399 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~((3 < 2147483647) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1]))) /\ ((Cardinality(SUBSET {1}) < IF TRUE THEN 1 ELSE 2147483647) /\ ((0 < 2147483647) \/ ([x \in Nat |-> x + 1] = 0)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
