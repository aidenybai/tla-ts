(*---
description: Evaluates a random record expression, seed 262, number 8399.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08399 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = ([[[x \in Nat |-> x + 1] EXCEPT ![1] = 7] EXCEPT ![Cardinality({x \in 1..3 : x > 1})] = (-1 - 1)])[Cardinality({0, -1})]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -2]"
---*)
