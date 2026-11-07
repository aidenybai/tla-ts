(*---
description: "Tuples sort by length before components."
ref: "tlc2/value/impl/TupleValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE tuples_by_length ----
EXTENDS Integers, TLC
Test == PrintT({<<1, 1>>, <<9>>})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<9>>, <<1, 1>>}"
---*)
