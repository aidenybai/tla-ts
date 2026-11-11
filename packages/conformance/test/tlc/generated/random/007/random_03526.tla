(*---
description: Evaluates a random int expression, seed 262, number 3526.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03526 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] EXCEPT !.a = (2 * 7)]).a - Len(<<CASE TRUE -> 1 [] OTHER -> 2, IF FALSE THEN 2 ELSE 2>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 12"
---*)
