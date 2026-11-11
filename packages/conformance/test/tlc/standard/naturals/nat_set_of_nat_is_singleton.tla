(*---
description: "{Nat, Nat} collapses to one element under normalization."
ref: tlc2/module/Naturals.java#compareTo
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE nat_set_of_nat_is_singleton ----
EXTENDS Naturals
Test == {Nat, Nat} = {Nat}
====

(*--- recorded
all:
  exit: 0
---*)
