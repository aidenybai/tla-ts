(*---
description: Evaluates a random int expression, seed 262, number 3622.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03622 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SelectSeq(SubSeq(<<2, 3>>, (-0), (-3)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
