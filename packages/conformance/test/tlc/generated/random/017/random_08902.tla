(*---
description: Evaluates a random int expression, seed 262, number 8902.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08902 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = -1] EXCEPT !.a = LET b13789 == -1 IN b13789] EXCEPT !.a = @ + Head([<<1>> EXCEPT ![1] = 0])]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
