(*---
description: Evaluates a random int expression, seed 262, number 6168.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06168 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SelectSeq((Append(<<1, 2>>, 3) \o Append(<<3, 1, 2>>, 0)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
