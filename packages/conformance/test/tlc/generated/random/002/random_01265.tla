(*---
description: Evaluates a random int expression, seed 262, number 1265.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01265 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[a |-> 3, b |-> FALSE] EXCEPT !.a = @ + (1 - 2)] EXCEPT !.a = Cardinality(UNION {{x \in 1..3 : x > 1}, {1}})]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
