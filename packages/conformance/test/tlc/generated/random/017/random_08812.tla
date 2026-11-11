(*---
description: Evaluates a random seq expression, seed 262, number 8812.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08812 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{2, 1, 3} -> {1, 2} \cap {2}] : TRUE) @@ ((([a |-> 1, b |-> TRUE]).a + (3 * 7)) :> (({x \in 1..3 : x > 1} \cap 2..1) \cap [(1 :> 2) EXCEPT ![1] = 0]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1 :> 2 @@ 2 :> 2 @@ 3 :> 2 @@ 22 :> {})"
---*)
