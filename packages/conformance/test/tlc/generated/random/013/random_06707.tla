(*---
description: Evaluates a random set expression, seed 262, number 6707.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06707 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality({LET b10279 == 2 IN 2 : b10278 \in (1 .. -1)}) : b10277 \in {(([a |-> 1]).a * Cardinality({2, 1, 3})), Cardinality({2 : b10280 \in 2..1})}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {0}"
---*)
