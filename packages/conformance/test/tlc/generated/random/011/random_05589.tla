(*---
description: Evaluates a random int expression, seed 262, number 5589.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05589 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len([SelectSeq(Tail(<<1, 2>>), LAMBDA e : e > 0) EXCEPT ![1] = ([[a |-> 1] EXCEPT !.a = 0]).a]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
