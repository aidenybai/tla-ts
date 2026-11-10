(*---
description: Evaluates a random int expression, seed 262, number 1847.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01847 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b2918 == ([[[a |-> 1] EXCEPT !.a = @ + [a |-> 1, b |-> TRUE]] EXCEPT !.a = CASE FALSE -> <<3, 1, 2>> [] OTHER -> 1]).a IN ((CHOOSE r \in [a : 1..2] : TRUE)).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
