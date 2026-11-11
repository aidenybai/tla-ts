(*---
description: Evaluates a random function expression, seed 262, number 7165.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07165 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail(<<-1, 3>>)) :> (-CASE (\A b11014 \in 2..1 : FALSE) -> (-3) [] OTHER -> IF FALSE THEN -1 ELSE 2)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (3 :> 3)"
---*)
