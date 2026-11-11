(*---
description: "Two function sets with empty domain are equal whatever their ranges."
ref: "tlc2/value/impl/SetOfFcnsValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE empty_domains_equal_ignoring_range ----
EXTENDS Integers
Test == [{} -> {1}] = [{} -> {2}]
====

(*--- recorded
all:
  exit: 0
---*)
