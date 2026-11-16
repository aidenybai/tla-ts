(*---
description: Evaluates a random set expression, seed 262, number 6031.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06031 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality((IF FALSE THEN 1 ELSE 1 .. (-b9288))) : b9288 \in ({(-0), (1 * 1)} \ UNION {(7 .. 2147483647), (2..1 \cup 2..1)})})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {0}"
---*)
