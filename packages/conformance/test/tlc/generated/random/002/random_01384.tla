(*---
description: Evaluates a random seq expression, seed 262, number 1384.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01384 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Cardinality({LET b2209 == b2208 IN b2209 : b2208 \in {b2210 \in {x \in 1..3 : x > 1} : FALSE}}), ((IF FALSE THEN 2 ELSE 2 * Cardinality({1})) + ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]).a)>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 3>>"
---*)
