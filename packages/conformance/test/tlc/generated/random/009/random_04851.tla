(*---
description: Evaluates a random int expression, seed 262, number 4851.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04851 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Tail([Append(<<3, 1, 2>>, 7) EXCEPT ![1] = CASE TRUE -> 7 [] OTHER -> 2])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
