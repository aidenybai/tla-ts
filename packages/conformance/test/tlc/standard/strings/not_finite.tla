(*---
description: STRING is not finite.
ref: tlc2/module/Strings.java#isFinite
features:
  - Strings
flags:
  - expression
outcome: success
---*)
---- MODULE not_finite ----
EXTENDS TLC, FiniteSets
Test == ~IsFiniteSet(STRING)
====

(*--- recorded
all:
  exit: 0
---*)
