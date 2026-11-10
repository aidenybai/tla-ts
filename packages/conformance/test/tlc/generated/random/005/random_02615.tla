(*---
description: Evaluates a random function expression, seed 262, number 2615.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02615 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4118 \in {b4119 \in ((1..3 \ 1..3) \cup (2147483647 .. 7)) : ((SUBSET {1} \cap 1..3) \subseteq UNION {1..3, {1, 2}})} |-> (-((b4118 % b4118) * Cardinality({1})))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
