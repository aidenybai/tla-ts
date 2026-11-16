(*---
description: Evaluates a random record expression, seed 262, number 3046.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03046 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[a |-> 7, b |-> <<1, 2>>] EXCEPT !.a = @ + (-7)] EXCEPT !.a = @ + IF (TRUE \/ TRUE) THEN (0 + 3) ELSE LET b4846 == 0 IN b4846]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
