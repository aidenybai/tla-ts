(*---
description: Evaluates a random bool expression, seed 262, number 5592.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05592 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a * ([[a |-> 1] EXCEPT !.a = 3]).a) < Cardinality({b8661 \in ({1} \cup {1}) : (FALSE <=> FALSE)})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
