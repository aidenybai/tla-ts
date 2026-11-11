(*---
description: Evaluates a random seq expression, seed 262, number 9775.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09775 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Tail(Tail((<<>> \o <<1, 2>>))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
