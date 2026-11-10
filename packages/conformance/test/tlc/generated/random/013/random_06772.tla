(*---
description: Evaluates a random set expression, seed 262, number 6772.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06772 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-LET b10383 == (-7) IN (b10383 \div b10383)), Cardinality(((1 - 1) .. IF FALSE THEN 7 ELSE 7))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-1, 8}"
---*)
