(*---
description: Evaluates a random seq expression, seed 262, number 5827.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05827 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<CASE (3 = 0) -> Cardinality({}) [] OTHER -> IF TRUE THEN 2147483647 ELSE 0, (-CASE FALSE -> -1 [] OTHER -> 3)>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2147483647>>"
---*)
