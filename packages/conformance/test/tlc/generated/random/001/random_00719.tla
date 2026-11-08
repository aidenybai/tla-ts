(*---
description: Evaluates a random int expression, seed 262, number 719.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00719 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((0 \in 2..1) /\ (TRUE => TRUE)) -> (-(3 % -1)) [] OTHER -> [a |-> (2 % -1), b |-> (TRUE <=> FALSE)] + (([[x \in Nat |-> x + 1] EXCEPT ![2147483647] = -1])[(2147483647 \div 2147483647)] + Cardinality((3 \div 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00719 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
