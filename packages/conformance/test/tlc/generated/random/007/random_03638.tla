(*---
description: Evaluates a random int expression, seed 262, number 3638.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03638 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Tail(Tail(Tail(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
