(*---
description: Evaluates a random seq expression, seed 262, number 8829.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08829 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq((Append(<<3, 1, 2>>, -1) \o <<3, 0>>), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 3>>"
---*)
