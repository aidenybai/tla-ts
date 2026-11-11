(*---
description: Evaluates a random seq expression, seed 262, number 4780.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04780 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((<<(-1 - 0), (2 + 7)>> \o Tail(<<0, 1>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<9, 1>>"
---*)
