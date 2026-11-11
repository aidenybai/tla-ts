(*---
description: Evaluates a random seq expression, seed 262, number 1898.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01898 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Tail((<<0, 7>> \o Append(<<1, 2>>, 2147483647))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<7, 1, 2, 2147483647>>"
---*)
