(*---
description: Evaluates a random bool expression, seed 262, number 6647.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06647 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF TRUE THEN 0 ELSE 2147483647 * ([x \in Nat |-> x + 1])[7]) = ((CHOOSE b10200 \in {x \in 1..3 : x > 1} : TRUE) * Len(<<1, 2>>))) \/ ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) = [a |-> (2147483647 % 1), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
