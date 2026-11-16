(*---
description: Evaluates a random int expression, seed 262, number 5783.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05783 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(CHOOSE b8913 \in {(-7), (-1 * 0)} : ([[a |-> 1] EXCEPT !.a = b8913] = [[a |-> 1] EXCEPT !.a = b8913]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 7"
---*)
