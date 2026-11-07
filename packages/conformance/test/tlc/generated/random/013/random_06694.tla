(*---
description: Evaluates a random int expression, seed 262, number 6694.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06694 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] EXCEPT !.a = @ + Cardinality({2, 1, 3})] EXCEPT !.a = Cardinality(({} \cup 2..1))]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
