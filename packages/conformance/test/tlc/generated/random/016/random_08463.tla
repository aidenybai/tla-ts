(*---
description: Evaluates a random seq expression, seed 262, number 8463.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08463 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Tail(<<(0 \div 2), (7 - -1)>>), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<8>>"
---*)
