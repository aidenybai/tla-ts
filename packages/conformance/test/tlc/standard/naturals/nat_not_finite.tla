(*---
description: Nat is not finite.
ref: tlc2/module/Naturals.java#isFinite
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE nat_not_finite ----
EXTENDS Naturals, FiniteSets
Test == ~IsFiniteSet(Nat)
====

(*--- recorded
all:
  exit: 0
---*)
