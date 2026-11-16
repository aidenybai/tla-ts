(*---
description: Evaluates a random seq expression, seed 262, number 7889.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07889 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Cardinality({(2 - b12179) : b12179 \in UNION {1..3, {2, 1, 3}}}), (LET b12180 == LET b12181 == 2147483647 IN b12181 IN ([x \in Nat |-> x + 1])[7] \div Cardinality({3, 7}))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 4>>"
---*)
