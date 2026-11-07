(*---
description: Evaluates a random record expression, seed 262, number 7776.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07776 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = ([a |-> (1 \div 1), b |-> [a |-> <<1, 2>>, b |-> FALSE]]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1]"
---*)
