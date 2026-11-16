(*---
description: Evaluates a random function expression, seed 262, number 5294.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05294 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE) @@ (Cardinality({b8198 : b8198 \in SUBSET {1}}) :> Head([<<3, 1, 2>> EXCEPT ![1] = 2]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> 1 @@ 1 :> 1 @@ 2 :> 2)"
---*)
