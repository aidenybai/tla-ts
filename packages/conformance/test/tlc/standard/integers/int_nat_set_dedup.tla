(*---
description: A set of Nat and Int keeps two elements after normalization.
ref: tlc2/module/Integers.java#compareTo
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE int_nat_set_dedup ----
EXTENDS Integers, FiniteSets
Test == Cardinality({Int, Nat, Int}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
