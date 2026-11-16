(*---
description: Evaluates a random int expression, seed 262, number 7378.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07378 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Tail(Tail(Append(<<3, 1, 2>>, 2147483647)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
