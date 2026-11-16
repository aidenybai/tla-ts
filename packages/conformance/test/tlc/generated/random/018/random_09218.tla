(*---
description: Evaluates a random bool expression, seed 262, number 9218.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09218 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((<<3, 1, 2>> = [x \in 1..2 |-> x]) = (~FALSE)) \/ ((\E b14308 \in {} : FALSE) => (\A b14309 \in 2..1 : TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
