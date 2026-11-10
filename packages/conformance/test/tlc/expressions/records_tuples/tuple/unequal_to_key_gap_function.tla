(*---
description: "A function on {1, 3} is not a tuple."
ref: "tlc2/value/impl/TupleValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE unequal_to_key_gap_function ----
EXTENDS Integers
Test == [i \in {1, 3} |-> i] # <<1, 3>>
====

(*--- recorded
all:
  exit: 0
---*)
