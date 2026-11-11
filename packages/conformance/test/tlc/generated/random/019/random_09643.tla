(*---
description: Evaluates a random function expression, seed 262, number 9643.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09643 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))) :> ((([a |-> 1, b |-> TRUE]).a * (-7)) + CASE (~FALSE) -> (3 \div 1) [] OTHER -> Len(<<>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-4>>"
---*)
