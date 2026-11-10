(*---
description: Evaluates a random int expression, seed 262, number 2275.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02275 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({b3591 \in ({-1, 3} \cap DOMAIN [x \in Nat |-> x + 1]) : (~(\E b3592 \in {1, 2} : TRUE))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
