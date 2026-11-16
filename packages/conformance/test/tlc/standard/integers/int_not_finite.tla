(*---
description: Int is not finite.
ref: tlc2/module/Integers.java#isFinite
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE int_not_finite ----
EXTENDS Integers, FiniteSets
Test == ~IsFiniteSet(Int)
====

(*--- recorded
all:
  exit: 0
---*)
