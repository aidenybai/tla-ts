(*---
description: Evaluates a random record expression, seed 262, number 8779.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08779 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = (([a |-> 1]).a * Head(<<1>>))] EXCEPT !.a = ([[a |-> -1, b |-> TRUE] EXCEPT !.a = Cardinality({1, 2})]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)
