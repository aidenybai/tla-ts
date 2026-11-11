(*---
description: Evaluates a random bool expression, seed 262, number 5035.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05035 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1]).a \div LET b7829 == 2147483647 IN -1) - (IF FALSE THEN 1 ELSE 2147483647 % ([x \in Nat |-> x + 1])[3])) \in {LET b7830 == Cardinality({}) IN (0 - 2), IF (3 \in {2, 1, 3}) THEN ([a |-> 1, b |-> TRUE]).a ELSE (7 + 3)}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
