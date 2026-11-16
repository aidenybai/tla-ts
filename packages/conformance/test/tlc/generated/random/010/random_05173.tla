(*---
description: Evaluates a random bool expression, seed 262, number 5173.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05173 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((\E b8026 \in {2147483647, 7} : (TRUE <=> FALSE)) \/ ({1, -1} = ({1} \ {1, 2})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
