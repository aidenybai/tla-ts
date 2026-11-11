(*---
description: Evaluates a random int expression, seed 262, number 9694.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09694 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-LET b15039 == ((CHOOSE f \in [{1, 2} \ {1} -> 1..2] : TRUE) @@ ({x \in 1..3 : x > 1} :> 0)) IN LET b15040 == LET b15041 == b15039 IN [x \in 1..2 |-> x] IN Len(<<3, 1, 2>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3"
---*)
