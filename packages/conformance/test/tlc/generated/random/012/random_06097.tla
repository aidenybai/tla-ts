(*---
description: Evaluates a random set expression, seed 262, number 6097.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06097 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1] EXCEPT !.a = -1]).a :> Cardinality({3 : b9383 \in SUBSET {1}})) @@ (CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-1 :> 1 @@ 1 :> 1 @@ 2 :> 1 @@ 3 :> 1)"
---*)
