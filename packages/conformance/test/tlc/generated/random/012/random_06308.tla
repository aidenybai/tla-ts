(*---
description: Evaluates a random int expression, seed 262, number 6308.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06308 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[a |-> 3, b |-> TRUE] EXCEPT !.a = @ + Cardinality({1})] EXCEPT !.a = ([[a |-> 1] EXCEPT !.a = @ + 3]).a]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 4"
---*)
