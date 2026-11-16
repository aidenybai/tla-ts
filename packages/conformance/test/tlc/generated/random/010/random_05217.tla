(*---
description: Evaluates a random record expression, seed 262, number 5217.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05217 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = ([[[a |-> 1] EXCEPT !.a = @ + 2] EXCEPT !.a = Cardinality(2..1)]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0]"
---*)
