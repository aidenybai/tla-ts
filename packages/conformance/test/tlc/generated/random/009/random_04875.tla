(*---
description: Evaluates a random function expression, seed 262, number 4875.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04875 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a] = ((CHOOSE b7594 \in {1} : TRUE) * LET b7595 == 7 IN b7595)] @@ (Cardinality({7, 2}) :> ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> 7)"
---*)
