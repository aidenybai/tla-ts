(*---
description: "Sorting tuples stops at the first different component, so a later incomparable pair is not reached."
ref: "tlc2/value/impl/TupleValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_stops_at_first_difference ----
EXTENDS Integers, FiniteSets
Test == Cardinality({<<1, "a">>, <<2, 3>>}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
