(*---
description: "Two intervals compare by bounds, so huge ones compare without enumerating."
ref: "tlc2/value/impl/IntervalValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE huge_intervals_compare_without_enumerating ----
EXTENDS Integers
Test == (1..2147483647) = (1..2147483647)
====

(*--- recorded
all:
  exit: 0
---*)
