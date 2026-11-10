(*---
description: Evaluates a random function expression, seed 262, number 5891.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05891 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail((CHOOSE f \in [{1, 2} -> {1}] : TRUE)), (LET b9090 == Len(<<>>) IN Len(<<>>) - (Len(<<3, 1, 2>>) * CASE FALSE -> 3 [] OTHER -> 7))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, -21>>"
---*)
