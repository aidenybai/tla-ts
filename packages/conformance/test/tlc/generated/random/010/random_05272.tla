(*---
description: Evaluates a random seq expression, seed 262, number 5272.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05272 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<((2 \div 2) % (CHOOSE b8159 \in {x \in 1..3 : x > 1} : TRUE)), (-Head(<<1, 2>>))>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
