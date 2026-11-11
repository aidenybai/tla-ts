(*---
description: Evaluates a random seq expression, seed 262, number 8662.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08662 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append(SortSeq(Append(<<1, 2>>, -1), LAMBDA p, q : p < q), (-(CHOOSE b13407 \in {x \in 1..3 : x > 1} : TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, -2>>"
---*)
