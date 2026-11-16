(*---
description: Evaluates a random seq expression, seed 262, number 3499.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03499 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([Append(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), CASE FALSE -> 1 [] OTHER -> 1) EXCEPT ![1] = ((2 \div 2147483647) - CASE TRUE -> 2 [] OTHER -> 2)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 1>>"
---*)
