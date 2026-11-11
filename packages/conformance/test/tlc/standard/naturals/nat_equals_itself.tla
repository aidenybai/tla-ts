(*---
description: Nat equals Nat through UserValue.compareTo.
ref: tlc2/module/Naturals.java#compareTo
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE nat_equals_itself ----
EXTENDS Naturals
Test == Nat = Nat
====

(*--- recorded
all:
  exit: 0
---*)
