(*---
description: Evaluates a random int expression, seed 262, number 4775.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04775 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b7456 == Head(SelectSeq(Tail(<<1>>), LAMBDA e : e > 0)) IN Len(SelectSeq(Tail(<<3, 1, 2>>), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
