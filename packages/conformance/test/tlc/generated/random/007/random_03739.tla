(*---
description: Evaluates a random int expression, seed 262, number 3739.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03739 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x] @@ (1 :> 2)))[(CHOOSE b5903 \in {1, 2} : TRUE)] * ((3 - 0) + (-1 \div 2147483647))) \div Head(SelectSeq(<<0, 2>>, LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
