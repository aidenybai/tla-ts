(*---
description: Evaluates a random seq expression, seed 262, number 5466.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05466 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([Tail(<<1, 2147483647>>) EXCEPT ![1] = Head(Append(<<3, 1, 2>>, 7))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3>>"
---*)
