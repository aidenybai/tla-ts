(*---
description: Evaluates a random int expression, seed 262, number 9997.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09997 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (\E b15542 \in UNION {{1}, 1..3} : (~TRUE)) THEN (([x \in Nat |-> x + 1])[2147483647] % Head(<<>>)) ELSE ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a % ((CHOOSE r \in [a : {1}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
