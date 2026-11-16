(*---
description: Evaluates a random int expression, seed 262, number 2800.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02800 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(((Nat \ {2, 1, 3}) \cap ({2, 1, 3} \cap Nat))) - Cardinality((({1, 2} \ 2..1) \ ({2, 1, 3} \cup {1, 2})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
