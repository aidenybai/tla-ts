(*---
description: Evaluates a random seq expression, seed 262, number 2960.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02960 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Tail(SelectSeq(Append(<<3, 1, 2>>, 7), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 7>>"
---*)
