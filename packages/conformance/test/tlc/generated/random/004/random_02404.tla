(*---
description: Evaluates a random function expression, seed 262, number 2404.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02404 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3805 \in ({Cardinality({1, 2}), Len(<<1>>)} \cap (Cardinality(SUBSET {1}) .. ([a |-> 1, b |-> TRUE]).a)) |-> (Cardinality((b3805 .. b3805)) \div (LET b3806 == b3805 IN 7 - (b3805 - b3805)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
