(*---
description: "An empty interval cup S returns S itself."
ref: "tlc2/value/impl/IntervalValue.java#cup"
flags: [expression]
outcome: success
---*)
---- MODULE cup_with_empty_returns_other ----
EXTENDS Integers
Test == ((2..1) \cup Nat) = Nat
====

(*--- recorded
all:
  exit: 0
---*)
