(*---
description: Any is not finite.
ref: tlc2/module/AnySet.java#isFinite
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE not_finite ----
EXTENDS TLC, FiniteSets
Test == ~IsFiniteSet(Any)
====

(*--- recorded
all:
  exit: 0
---*)
