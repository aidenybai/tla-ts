(*---
description: Evaluates a random int expression, seed 262, number 4520.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04520 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SelectSeq((<<0, 0>> \o Append(<<1, 2>>, 3)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
