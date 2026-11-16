(*---
description: Evaluates a random seq expression, seed 262, number 7375.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07375 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq(((<<1>> \o <<1, 2>>) \o [<<1, 2>> EXCEPT ![1] = -1]), ((3 \div 2) * (2147483647 * 1)), Len(Tail(<<3, 1, 2>>))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
