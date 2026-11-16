(*---
description: Evaluates a random seq expression, seed 262, number 9483.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09483 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SelectSeq([[<<1>> EXCEPT ![1] = 7] EXCEPT ![1] = LET b14729 == 0 IN b14729], LAMBDA e : e > 0), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
