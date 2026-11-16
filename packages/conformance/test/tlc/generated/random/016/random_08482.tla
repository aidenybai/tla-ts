(*---
description: Evaluates a random int expression, seed 262, number 8482.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08482 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-((Len(<<1, 2>>) - (2 * 3)) + ([[a |-> 1] EXCEPT !.a = 2147483647]).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2147483643"
---*)
