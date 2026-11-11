(*---
description: Evaluates a random seq expression, seed 262, number 4744.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04744 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SelectSeq(SelectSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0), LAMBDA e : e > 0), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2>>"
---*)
