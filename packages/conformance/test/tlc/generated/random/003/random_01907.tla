(*---
description: Evaluates a random int expression, seed 262, number 1907.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01907 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(-Len(Append(<<>>, 2147483647)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
