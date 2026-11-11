(*---
description: Evaluates a random seq expression, seed 262, number 5646.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05646 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Tail(Tail(<<2147483647, 0>>)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
