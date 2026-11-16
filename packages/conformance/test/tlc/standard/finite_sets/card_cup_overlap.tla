(*---
description: \cup counts overlapping elements once.
ref: tlc2/value/impl/SetCupValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_cup_overlap ----
EXTENDS FiniteSets, Naturals
Test == Cardinality(1..3 \cup 2..4) = 4
====

(*--- recorded
all:
  exit: 0
---*)
