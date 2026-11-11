(*---
description: Evaluates a random int expression, seed 262, number 4729.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04729 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[a |-> 3, b |-> FALSE] EXCEPT !.a = (0 + 1)] EXCEPT !.a = @ + Head(Append(<<1>>, 7))]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
