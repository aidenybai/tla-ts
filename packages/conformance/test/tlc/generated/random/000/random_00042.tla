(*---
description: Evaluates a random bool expression, seed 262, number 42.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00042 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1]).a \div ([a |-> 1, b |-> TRUE]).a) \div ((2 + 2) * (1 * 2))) = ([a |-> (3 + 2), b |-> [[x \in Nat |-> x + 1] EXCEPT ![2] = -1]]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
