(*---
description: "A tuple equals a function on 1..n, on either side."
ref: "tlc2/value/impl/TupleValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE equal_to_function_on_interval ----
EXTENDS Integers
Test == <<1, 2>> = [i \in 1..2 |-> i] /\ [i \in 1..2 |-> i] = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
