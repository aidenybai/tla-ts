(*---
description: Evaluates a random set expression, seed 262, number 136.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00136 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> ([a |-> 1, b |-> TRUE]).a, b |-> [[a |-> 1] EXCEPT !.a = 0]]).a :> (((2 - 2) \div ([a |-> 1, b |-> TRUE]).a) \div Len(<<0, 0>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0>>"
---*)
