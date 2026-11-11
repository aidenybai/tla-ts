(*---
description: Evaluates a random set expression, seed 262, number 187.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00187 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-LET b299 == Head(<<3, 1, 2>>) IN (b298 - b299)) : b298 \in (((1 .. 0) \cap (2..1 \cap {x \in 1..3 : x > 1})) \cap {b300 \in (2..1 \cap {x \in 1..3 : x > 1}) : (\A b301 \in SUBSET {1} : TRUE)})})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
