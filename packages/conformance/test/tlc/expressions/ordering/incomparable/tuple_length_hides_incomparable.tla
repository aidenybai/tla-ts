(*---
description: "Tuples of different length sort without comparing components."
ref: "tlc2/value/impl/TupleValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_length_hides_incomparable ----
EXTENDS Integers, FiniteSets
Test == Cardinality({<<"a">>, <<1, 2>>}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
