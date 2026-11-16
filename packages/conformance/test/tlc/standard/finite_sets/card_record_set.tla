(*---
description: A record set has the product of its field cardinalities.
ref: tlc2/value/impl/SetOfRcdsValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_record_set ----
EXTENDS FiniteSets, Naturals
Test == Cardinality([a : {1, 2}, b : {1, 2, 3}]) = 6 /\ Cardinality([a : {}]) = 0
====

(*--- recorded
all:
  exit: 0
---*)
