(*---
description: Evaluates a random int expression, seed 262, number 5974.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05974 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[a |-> 1, b |-> TRUE] EXCEPT !.a = Head(<<3, 1, 2>>)] EXCEPT !.a = (-IF FALSE THEN 1 ELSE 1)]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
