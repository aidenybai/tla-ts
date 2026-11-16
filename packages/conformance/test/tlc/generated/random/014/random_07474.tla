(*---
description: Evaluates a random int expression, seed 262, number 7474.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07474 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(CASE (TRUE \/ FALSE) -> (3 - 1) [] OTHER -> ((1 :> 2))[7] % Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2"
---*)
