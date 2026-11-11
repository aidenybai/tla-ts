(*---
description: Evaluates a random function expression, seed 262, number 2533.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02533 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-((Cardinality(SUBSET {1}) - IF FALSE THEN 2147483647 ELSE 0) - IF (0 \in {2, 1, 3}) THEN (7 * 2147483647) ELSE CASE TRUE -> -1 [] OTHER -> <<1, 2>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3"
---*)
