(*---
description: Evaluates a random int expression, seed 262, number 7896.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07896 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append([(<<>> \o <<1>>) EXCEPT ![1] = Len(<<3, 1, 2>>)], ((1 + 3) * CASE TRUE -> 1 [] OTHER -> 7))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
