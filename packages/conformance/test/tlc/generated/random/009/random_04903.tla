(*---
description: Evaluates a random int expression, seed 262, number 4903.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04903 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]).a : b7634 \in DOMAIN (CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE)}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
