(*---
description: Evaluates a random int expression, seed 262, number 6806.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06806 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Tail((SubSeq(<<1, 2>>, 0, -1) \o Tail(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
