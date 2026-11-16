(*---
description: Evaluates a random bool expression, seed 262, number 765.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00765 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b1253 \in ({3, -1} \ {b1254 \in 2..1 : TRUE}) : (\E b1255 \in {b1253, 0} : (TRUE <=> TRUE))) \/ (((2147483647 .. 3) = {b1256 \in 2..1 : FALSE}) => (<<-1, 7>> = (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
