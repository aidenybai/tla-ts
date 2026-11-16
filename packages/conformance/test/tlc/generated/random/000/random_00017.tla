(*---
description: Evaluates a random seq expression, seed 262, number 17.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00017 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq(<<IF TRUE THEN 1 ELSE -1, (-7)>>, LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
