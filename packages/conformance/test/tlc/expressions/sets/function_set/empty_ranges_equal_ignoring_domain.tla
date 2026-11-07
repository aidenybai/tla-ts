(*---
description: "Two function sets with empty range are equal whatever their non-empty domains."
ref: "tlc2/value/impl/SetOfFcnsValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE empty_ranges_equal_ignoring_domain ----
EXTENDS Integers
Test == [{1} -> {}] = [{2} -> {}]
====

(*--- recorded
all:
  exit: 0
---*)
