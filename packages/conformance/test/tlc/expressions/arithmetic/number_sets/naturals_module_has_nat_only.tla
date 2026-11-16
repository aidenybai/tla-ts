(*---
description: "EXTENDS Naturals gives the same Nat as Integers."
ref: "tlc2/module/Naturals.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE naturals_module_has_nat_only ----
EXTENDS Naturals
Test == 0 \in Nat /\ 1 + 1 = 2
====

(*--- recorded
all:
  exit: 0
---*)
