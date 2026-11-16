(*---
description: Evaluates a random set expression, seed 262, number 4476.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04476 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ((([a |-> 1]).a \div IF TRUE THEN 7 ELSE 0) :> Cardinality({b7041 : b7041 \in {1, 2}})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {0}"
---*)
