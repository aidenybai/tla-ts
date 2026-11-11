(*---
description: Evaluates a random record expression, seed 262, number 832.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00832 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] EXCEPT !.a = ([a |-> 1]).a] EXCEPT !.a = ((2147483647 \div 2) \div Head(<<1>>))] EXCEPT !.a = (CHOOSE f \in [{1} -> {2, 1, 3}] : TRUE)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> <<1>>, b |-> TRUE]"
---*)
