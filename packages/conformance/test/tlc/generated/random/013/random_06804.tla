(*---
description: Evaluates a random int expression, seed 262, number 6804.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06804 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({([[a |-> 1] EXCEPT !.a = 1]).a, ((7 + 7) % (CHOOSE b10435 \in {2, 1, 3} : TRUE))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
