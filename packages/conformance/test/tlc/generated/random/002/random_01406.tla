(*---
description: Evaluates a random bool expression, seed 262, number 1406.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01406 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(({-1, -1} \subseteq {b2235 \in {1, 2} : TRUE}) => (({2, 1, 3} \cap Nat) = (1..3 \cap {})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
