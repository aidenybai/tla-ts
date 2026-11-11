(*---
description: Evaluates a random bool expression, seed 262, number 717.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00717 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((7 * 3) < (0 \div 2)) /\ ((\E b1182 \in SUBSET {1} : TRUE) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1])))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
