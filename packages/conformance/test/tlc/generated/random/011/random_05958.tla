(*---
description: Evaluates a random function expression, seed 262, number 5958.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05958 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1] EXCEPT !.a = 2] EXCEPT !.a = Len(<<1>>)]).a :> ([a |-> (0 % 3), b |-> (2 \in {1, 2})]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0>>"
---*)
