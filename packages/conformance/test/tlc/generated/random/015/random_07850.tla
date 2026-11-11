(*---
description: Evaluates a random function expression, seed 262, number 7850.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07850 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b12129 \in ({} \cap 1..3) |-> (CHOOSE b12130 \in {2, 1, 3} : TRUE)] @@ (Cardinality(2..1) :> (2 - 7))) @@ (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> -5 @@ 2 :> 1)"
---*)
