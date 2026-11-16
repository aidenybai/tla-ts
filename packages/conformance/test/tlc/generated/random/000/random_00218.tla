(*---
description: Evaluates a random seq expression, seed 262, number 218.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00218 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(Len((<<3, 1, 2>> \o <<3, 1, 2>>)) * (CHOOSE b355 \in {b356 : b356 \in 1..3} : (\E b357 \in {1, 2} : TRUE))), (([[a |-> 1] EXCEPT !.a = -1]).a * Cardinality({2, 1}))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<6, -2>>"
---*)
