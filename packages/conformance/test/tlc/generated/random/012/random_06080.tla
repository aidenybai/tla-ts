(*---
description: Evaluates a random record expression, seed 262, number 6080.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06080 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + ([[a |-> 1] EXCEPT !.a = @ + -1]).a] EXCEPT !.a = ([a |-> Head(<<3, 1, 2>>), b |-> (FALSE /\ TRUE)]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 3]"
---*)
