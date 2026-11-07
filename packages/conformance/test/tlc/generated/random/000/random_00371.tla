(*---
description: Evaluates a random bool expression, seed 262, number 371.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00371 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b610 == (1 - 1) IN (-2) \in ((1 .. -1) \cup ({2, 1, 3} \ {1}))) \/ (~(\E b611 \in ({1, 2} \cap {2, 1, 3}) : ([a |-> 1] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
