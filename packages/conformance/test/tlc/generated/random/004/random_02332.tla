(*---
description: Evaluates a random seq expression, seed 262, number 2332.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02332 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(<<IF TRUE THEN 0 ELSE 2, CASE FALSE -> 1 [] OTHER -> 2147483647>>) EXCEPT ![1] = Cardinality({([a |-> 1]).a, (7 * 0)})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
