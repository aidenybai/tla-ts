(*---
description: Evaluates a random int expression, seed 262, number 6646.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06646 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Tail(Append(Append(<<3, 1, 2>>, 1), [b10199 \in {1, 2} |-> b10199]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
