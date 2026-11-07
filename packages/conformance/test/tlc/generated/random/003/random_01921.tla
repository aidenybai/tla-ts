(*---
description: Evaluates a random record expression, seed 262, number 1921.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01921 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b3018 == Head((<<3, 1, 2>> \o <<1, 2>>)) IN ((b3018 % 1) - ([a |-> 1, b |-> TRUE]).a), b |-> (((-1 - -1) * Cardinality({})) = ([[a |-> 1] EXCEPT !.a = @ + 2]).a)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -1, b |-> FALSE]"
---*)
