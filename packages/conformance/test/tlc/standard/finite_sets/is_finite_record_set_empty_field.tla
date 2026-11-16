(*---
description: One empty field empties the record set, so it is finite though another field is Nat.
ref: tlc2/value/impl/SetOfRcdsValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_record_set_empty_field ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet([a : {}, b : Nat])
====

(*--- recorded
all:
  exit: 0
---*)
