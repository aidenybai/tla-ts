(*---
description: Evaluates a random int expression, seed 262, number 4559.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04559 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Head(Tail(Append(<<3, 1, 2>>, [x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
