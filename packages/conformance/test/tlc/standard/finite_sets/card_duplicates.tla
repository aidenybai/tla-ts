(*---
description: Repeated elements count once.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_duplicates ----
EXTENDS FiniteSets, Naturals
Test == Cardinality({1, 1, 2}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
