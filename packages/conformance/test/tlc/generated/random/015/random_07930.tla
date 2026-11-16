(*---
description: Evaluates a random seq expression, seed 262, number 7930.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07930 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Tail(SelectSeq(Append(<<1>>, 7), LAMBDA e : e > 0)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<7>>"
---*)
