(*---
description: Evaluates a random int expression, seed 262, number 6161.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06161 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[a |-> 2147483647, b |-> FALSE] EXCEPT !.a = (1 * 1)] EXCEPT !.a = (-(-3))]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
