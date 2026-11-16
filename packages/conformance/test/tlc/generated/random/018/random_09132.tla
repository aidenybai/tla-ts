(*---
description: Evaluates a random int expression, seed 262, number 9132.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09132 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-([[a |-> [a |-> 1, b |-> TRUE], b |-> FALSE] EXCEPT !.a = (2 \div 3)]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
