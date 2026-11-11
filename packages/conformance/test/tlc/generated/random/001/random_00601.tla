(*---
description: Evaluates a random record expression, seed 262, number 601.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00601 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = ([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + LET b1007 == 2 IN 1]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)
