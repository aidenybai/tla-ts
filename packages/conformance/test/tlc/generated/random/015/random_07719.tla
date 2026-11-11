(*---
description: Evaluates a random bool expression, seed 262, number 7719.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07719 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = Len(Tail(<<3, 1, 2>>))] EXCEPT !.a = Len(<<(3 - 0), Head(<<3, 1, 2>>)>>)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)
