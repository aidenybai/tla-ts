(*---
description: Evaluates a random seq expression, seed 262, number 1899.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01899 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(Tail((<<1, 2>> \o <<1>>)), LAMBDA e : e > 0) EXCEPT ![1] = (-(-LET b2981 == 3 IN b2981))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 1>>"
---*)
