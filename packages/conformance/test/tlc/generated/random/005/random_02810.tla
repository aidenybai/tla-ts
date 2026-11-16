(*---
description: Evaluates a random int expression, seed 262, number 2810.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02810 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = @ + 3] EXCEPT !.a = LET b4462 == 1 IN 2] EXCEPT !.a = (Head(<<1, 2>>) + Head(<<3, 1, 2>>))]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 4"
---*)
