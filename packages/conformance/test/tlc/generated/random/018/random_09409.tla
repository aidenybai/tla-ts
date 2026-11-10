(*---
description: Evaluates a random int expression, seed 262, number 9409.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09409 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + ([a |-> 1, b |-> TRUE]).a]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
