(*---
description: Evaluates a random seq expression, seed 262, number 139.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00139 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Tail(SelectSeq((<<3, 1, 2>> \o <<1, 2>>), LAMBDA e : e > 0)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1, 2, 2>>"
---*)
