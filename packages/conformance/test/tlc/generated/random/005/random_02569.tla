(*---
description: Evaluates a random record expression, seed 262, number 2569.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02569 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b4046 == ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a IN LET b4047 == ([a |-> 1]).a IN (2 + b4047), b |-> ([a |-> CASE FALSE -> 2 [] OTHER -> 7, b |-> (FALSE <=> FALSE)]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 3, b |-> 7]"
---*)
