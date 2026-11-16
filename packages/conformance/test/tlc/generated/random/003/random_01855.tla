(*---
description: Evaluates a random seq expression, seed 262, number 1855.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01855 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq([(<<>> \o <<1, 2>>) EXCEPT ![1] = IF TRUE THEN 2 ELSE 2], Len(<<0, 1>>), Len(<<0, 7>>)) EXCEPT ![1] = Len(SelectSeq([<<1, 2>> EXCEPT ![1] = -1], LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
