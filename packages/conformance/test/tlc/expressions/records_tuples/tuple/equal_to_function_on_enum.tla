(*---
description: "A tuple equals a function on an enumerated 1..n."
ref: "tlc2/value/impl/TupleValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE equal_to_function_on_enum ----
EXTENDS Integers
Test == <<1, 2>> = [i \in {1, 2} |-> i] /\ [i \in {2, 1} |-> i] = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
