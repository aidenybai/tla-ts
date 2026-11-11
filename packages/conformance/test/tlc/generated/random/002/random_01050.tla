(*---
description: Evaluates a random int expression, seed 262, number 1050.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01050 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = @ + 2] EXCEPT !.a = [a |-> 2, b |-> <<1>>]] EXCEPT !.a = Len(Append(<<>>, 1))]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
