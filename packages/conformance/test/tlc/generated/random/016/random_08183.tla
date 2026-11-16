(*---
description: Evaluates a random record expression, seed 262, number 8183.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08183 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(Tail(Tail(<<1, 2>>))), b |-> (~((\E b12655 \in {2, 1, 3} : TRUE) => (-1 \in {1})))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0, b |-> TRUE]"
---*)
