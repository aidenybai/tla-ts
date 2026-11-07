(*---
description: Evaluates a random set expression, seed 262, number 1766.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01766 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ([b2803 \in ({} \cup {x \in 1..3 : x > 1}) |-> Head(<<3, 1, 2>>)] @@ [b2804 \in ({1} \cup {x \in 1..3 : x > 1}) |-> LET b2805 == 2147483647 IN 1]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
