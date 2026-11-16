(*---
description: Evaluates a random int expression, seed 262, number 2975.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02975 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Len(SubSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LET b4724 == 2 IN b4724, Head(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
