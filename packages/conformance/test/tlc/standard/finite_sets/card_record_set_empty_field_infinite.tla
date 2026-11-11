(*---
description: An empty field makes the record set empty even with a Nat field.
ref: tlc2/value/impl/SetOfRcdsValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_record_set_empty_field_infinite ----
EXTENDS FiniteSets, Naturals
Test == Cardinality([a : {}, b : Nat]) = 0
====

(*--- recorded
all:
  exit: 0
---*)
