(*---
description: Evaluates a random bool expression, seed 262, number 9357.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09357 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 + 0) < Cardinality({1})) <=> ({b14525 : b14525 \in 1..3} \subseteq UNION {{}, {1}})) /\ ((LET b14526 == 1 IN b14526 - ([a |-> 1, b |-> TRUE]).a) < Cardinality(({} \cup {1})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
