(*---
description: Evaluates a random int expression, seed 262, number 1690.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01690 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Len(SelectSeq(Tail(<<1, 2>>), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
