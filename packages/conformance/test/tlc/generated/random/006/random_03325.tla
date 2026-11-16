(*---
description: Evaluates a random int expression, seed 262, number 3325.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03325 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-LET b5284 == IF (\E b5285 \in {} : TRUE) THEN (3 + <<5, 6>>) ELSE LET b5286 == 0 IN 7 IN (LET b5287 == {1, 2} IN -1 - Cardinality({}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
