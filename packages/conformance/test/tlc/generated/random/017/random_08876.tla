(*---
description: Evaluates a random bool expression, seed 262, number 8876.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08876 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SelectSeq([<<3, 1, 2>> EXCEPT ![1] = 0], LAMBDA e : e > 0) = (CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE)) /\ ((~(2147483647 = 2147483647)) \/ (LET b13747 == 2147483647 IN 0 \in (2..1 \cap Nat)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
