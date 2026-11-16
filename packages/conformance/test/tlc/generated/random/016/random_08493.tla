(*---
description: Evaluates a random bool expression, seed 262, number 8493.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08493 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a < ((3 \div 7) * LET b13149 == -1 IN 2147483647))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
