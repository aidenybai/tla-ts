(*---
description: Evaluates a random function expression, seed 262, number 2016.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02016 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append([(<<1>> \o <<1>>) EXCEPT ![1] = Head(<<3, 1, 2>>)], (IF TRUE THEN 0 ELSE 2147483647 \div (CHOOSE b3195 \in 2..1 : TRUE))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 1>>"
---*)
