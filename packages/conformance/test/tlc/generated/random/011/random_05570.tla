(*---
description: Evaluates a random seq expression, seed 262, number 5570.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05570 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SelectSeq(([<<3, 1, 2>> EXCEPT ![1] = 7] \o [<<1, 2>> EXCEPT ![1] = 2147483647]), LAMBDA e : e > 0), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<7, 1, 2, 2147483647, 2>>"
---*)
