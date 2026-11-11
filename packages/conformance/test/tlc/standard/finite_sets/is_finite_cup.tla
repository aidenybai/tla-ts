(*---
description: A union is finite only if both sides are.
ref: tlc2/value/impl/SetCupValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_cup ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet({1} \cup {2}) /\ ~IsFiniteSet(Nat \cup {1}) /\ ~IsFiniteSet({1} \cup Nat)
====

(*--- recorded
all:
  exit: 0
---*)
