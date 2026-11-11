(*---
description: A finite set minus Nat enumerates the finite side.
ref: tlc2/value/impl/SetDiffValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_diff_finite_minus_nat ----
EXTENDS FiniteSets, Naturals
Test == Cardinality({0 - 1, 1} \ Nat) = 1
====

(*--- recorded
all:
  exit: 0
---*)
