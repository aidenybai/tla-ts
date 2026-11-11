(*---
description: Evaluates a random bool expression, seed 262, number 6818.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06818 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b10452 \in (({b10453 : b10453 \in {2, 1, 3}} \cap {1, 0}) \cap ((-7) .. (1 + 7))) : ((([a |-> 1, b |-> TRUE]).a < IF FALSE THEN 7 ELSE b10452) <=> (~(0 = 2)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
