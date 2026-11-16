(*---
description: Evaluates a random int expression, seed 262, number 8342.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08342 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = @ + LET b12906 == 3 IN 3]).a * (-([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -24"
---*)
