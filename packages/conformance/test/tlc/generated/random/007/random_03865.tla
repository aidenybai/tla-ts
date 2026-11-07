(*---
description: Evaluates a random int expression, seed 262, number 3865.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03865 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = CASE TRUE -> 2147483647 [] OTHER -> -1]).a + Head(([<<1, 2>> EXCEPT ![1] = 0] \o SelectSeq(<<1>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2147483647"
---*)
