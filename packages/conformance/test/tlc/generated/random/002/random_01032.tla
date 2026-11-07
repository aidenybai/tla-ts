(*---
description: Evaluates a random seq expression, seed 262, number 1032.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01032 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq([<<7, 7>> EXCEPT ![1] = ([a |-> 1, b |-> TRUE]).a], LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<7>>"
---*)
