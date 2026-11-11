(*---
description: "A function on 2..3 is not a tuple."
ref: "tlc2/value/impl/TupleValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE unequal_to_shifted_function ----
EXTENDS Integers
Test == [i \in 2..3 |-> i] # <<2, 3>> /\ <<2, 3>> # [i \in 2..3 |-> i]
====

(*--- recorded
all:
  exit: 0
---*)
