(*---
description: Evaluates a random function expression, seed 262, number 5760.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05760 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8866 \in {IF ([x \in Nat |-> x + 1] \/ TRUE) THEN LET b8868 == b8867 IN b8868 ELSE ((1 :> 2) @@ b8867) : b8867 \in (({1, 2} \cap {}) \ ({1} \cup {2, 1, 3}))} |-> LET b8869 == ((b8866 + 0) + LET b8870 == -1 IN b8866) IN ((b8866 + b8866) * (7 + b8866))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
