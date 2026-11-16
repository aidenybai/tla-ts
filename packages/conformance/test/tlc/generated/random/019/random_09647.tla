(*---
description: Evaluates a random function expression, seed 262, number 9647.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09647 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SubSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), (2147483647 - 7), LET b14983 == 2147483647 IN 2)) :> Cardinality({b14984 \in (2 .. 2) : (TRUE \/ TRUE)})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> 1)"
---*)
