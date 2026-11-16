(*---
description: Evaluates a random function expression, seed 262, number 5638.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05638 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({x \in 1..3 : x > 1}) - ([a |-> 1]).a) :> Cardinality({b8709 \in {2, 1, 3} : TRUE})) @@ (CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 1>>"
---*)
