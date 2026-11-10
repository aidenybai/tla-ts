(*---
description: Evaluates a random function expression, seed 262, number 7473.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07473 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append(SelectSeq(Append(<<1>>, -1), LAMBDA e : e > 0), Len(Tail(<<1, 2>>))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1>>"
---*)
