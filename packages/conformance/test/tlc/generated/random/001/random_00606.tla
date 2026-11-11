(*---
description: Evaluates a random seq expression, seed 262, number 606.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00606 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq((SelectSeq(Append(<<1, 2>>, 7), LAMBDA e : e > 0) \o SelectSeq(<<-1, 3>>, LAMBDA e : e > 0)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 3, 7>>"
---*)
