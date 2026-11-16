(*---
description: Evaluates a random bool expression, seed 262, number 9320.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09320 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((({1, 2} \ {1, 2}) \subseteq {1, 2}) \/ ((FALSE <=> FALSE) => (\E b14458 \in {} : TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
