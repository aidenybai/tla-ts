(*---
description: Evaluates a random int expression, seed 262, number 5730.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05730 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> LET b8816 == (2147483647 - 3) IN IF FALSE THEN 0 ELSE 0, b |-> ([[a |-> 1] EXCEPT !.a = 3] = [[a |-> 1] EXCEPT !.a = 2147483647])]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
