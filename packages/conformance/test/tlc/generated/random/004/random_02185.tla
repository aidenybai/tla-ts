(*---
description: Evaluates a random seq expression, seed 262, number 2185.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02185 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<CASE (TRUE \/ FALSE) -> IF FALSE THEN 2 ELSE 2147483647 [] OTHER -> IF TRUE THEN -1 ELSE 2, (IF FALSE THEN 2 ELSE 2 - Cardinality(1..3))>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-1, 2147483647>>"
---*)
