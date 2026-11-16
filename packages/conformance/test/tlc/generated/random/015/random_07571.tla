(*---
description: Evaluates a random int expression, seed 262, number 7571.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07571 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SelectSeq(SelectSeq([<<3, 1, 2>> EXCEPT ![1] = 1], LAMBDA e : e > 0), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
