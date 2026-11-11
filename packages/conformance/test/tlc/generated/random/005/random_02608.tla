(*---
description: Evaluates a random int expression, seed 262, number 2608.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02608 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SelectSeq(Append(Tail(<<3, 1, 2>>), (7 \div 7)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
