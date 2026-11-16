(*---
description: Evaluates a random function expression, seed 262, number 3229.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03229 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(([[x \in Nat |-> x + 1] EXCEPT ![7] = 2147483647])[LET b5129 == 0 IN 3] \div ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a), (-Cardinality({2147483647, 2147483647}))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-1, 2}"
---*)
