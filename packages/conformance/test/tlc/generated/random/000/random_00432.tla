(*---
description: Evaluates a random record expression, seed 262, number 432.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00432 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + Head(<<([a |-> 1, b |-> TRUE]).a, (7 \div 3)>>)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)
