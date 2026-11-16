(*---
description: Evaluates a random int expression, seed 262, number 5482.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05482 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = (-2)] EXCEPT !.a = LET b8481 == (7 - 3) IN IF TRUE THEN 0 ELSE 2]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
