(*---
description: Evaluates a random seq expression, seed 262, number 5538.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05538 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SortSeq(SubSeq(<<7, 7>>, CASE TRUE -> 1 [] OTHER -> -1, ([a |-> 1, b |-> TRUE]).a), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
