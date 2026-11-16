(*---
description: "Tuples of equal length sort by component, left first."
ref: "tlc2/value/impl/TupleValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE tuples_same_length_by_components ----
EXTENDS Integers, TLC
Test == PrintT({<<2, 1>>, <<1, 2>>})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 2>>, <<2, 1>>}"
---*)
