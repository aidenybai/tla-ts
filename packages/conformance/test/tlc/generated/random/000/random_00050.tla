(*---
description: Evaluates a random seq expression, seed 262, number 50.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00050 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SortSeq([<<<<3, 1, 2>>, 2147483647>> EXCEPT ![1] = CASE TRUE -> 2 [] OTHER -> 2], LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2147483647>>"
---*)
