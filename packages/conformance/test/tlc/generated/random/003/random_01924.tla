(*---
description: Evaluates a random function expression, seed 262, number 1924.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01924 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE f \in [1..2 -> {1, 2}] : TRUE) @@ (CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE)) EXCEPT ![Len([<<3, 3>> EXCEPT ![1] = Len(<<>>)])] = ((-CASE FALSE -> 7 [] OTHER -> -1) \div IF (3 < 3) THEN Len(<<3, 1, 2>>) ELSE CASE TRUE -> 2147483647 [] OTHER -> 1)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 0, 1>>"
---*)
