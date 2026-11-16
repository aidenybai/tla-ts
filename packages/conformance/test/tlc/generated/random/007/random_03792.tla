(*---
description: Evaluates a random set expression, seed 262, number 3792.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03792 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality({(2 - b5983) : b5983 \in DOMAIN [x \in 1..2 |-> x]}) : b5982 \in (((3 - 1) .. (-0)) \cup ((2147483647 \div 3) .. (0 \div 7)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
