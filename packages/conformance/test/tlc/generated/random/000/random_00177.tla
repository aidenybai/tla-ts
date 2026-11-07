(*---
description: Evaluates a random int expression, seed 262, number 177.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00177 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> CASE (FALSE \/ FALSE) -> (3 % -1) [] OTHER -> Len(<<3, 1, 2>>), b |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1] = (CHOOSE r \in [a : {2, 1, 3}] : TRUE))]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
