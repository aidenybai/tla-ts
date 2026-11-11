(*---
description: Evaluates a random function expression, seed 262, number 5822.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05822 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8976 \in (((SUBSET {1} \cap SUBSET {1}) \ DOMAIN (1 :> 2)) \cap DOMAIN (CHOOSE f \in [{} -> {1, 2}] : TRUE)) |-> (Head([<<1>> EXCEPT ![1] = 1]) - (Len(<<>>) * Cardinality(SUBSET {1})))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
