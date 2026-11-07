(*---
description: A function set has |range|^|domain| elements.
ref: tlc2/value/impl/SetOfFcnsValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_function_set ----
EXTENDS FiniteSets, Naturals
Test == Cardinality([1..3 -> {1, 2}]) = 8 /\ Cardinality([{} -> {1}]) = 1 /\ Cardinality([{1} -> {}]) = 0
====

(*--- recorded
all:
  exit: 0
---*)
