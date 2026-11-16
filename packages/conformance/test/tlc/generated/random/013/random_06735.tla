(*---
description: Evaluates a random int expression, seed 262, number 6735.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06735 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SelectSeq(<<-1, 2147483647>>, LAMBDA e : e > 0)) \div (Cardinality(DOMAIN [x \in 1..2 |-> x]) * (CHOOSE b10322 \in (-1 .. 2) : (\A b10323 \in {x \in 1..3 : x > 1} : TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
