(*---
description: Evaluates a random function expression, seed 262, number 1808.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01808 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([a |-> 2147483647, b |-> FALSE]).a :> Cardinality({b2860 \in {1} : TRUE})) @@ (((CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE) @@ (-1 :> 7)) @@ (Cardinality({x \in 1..3 : x > 1}) :> (2 + 0)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-1 :> 7 @@ 1 :> 2 @@ 2 :> 2 @@ 2147483647 :> 1)"
---*)
