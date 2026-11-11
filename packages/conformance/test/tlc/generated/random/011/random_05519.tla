(*---
description: Evaluates a random int expression, seed 262, number 5519.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05519 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SortSeq(Tail(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
