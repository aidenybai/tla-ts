(*---
description: Evaluates a random bool expression, seed 262, number 8275.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08275 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({Cardinality(({2, 1, 3} \cup {})) : b12817 \in ((1..3 \cap 1..3) \ ({1, 2} \cup Nat))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
