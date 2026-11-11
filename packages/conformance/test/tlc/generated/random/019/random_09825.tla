(*---
description: Evaluates a random int expression, seed 262, number 9825.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09825 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([Tail(<<-1, 0>>) EXCEPT ![1] = LET b15254 == (2147483647 * 1) IN IF FALSE THEN b15254 ELSE 1] \o <<LET b15255 == IF {1} THEN -1 ELSE 0 IN ((1 :> 2))[1], Cardinality(({1} \cap {2, 1, 3}))>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 1>>"
---*)
