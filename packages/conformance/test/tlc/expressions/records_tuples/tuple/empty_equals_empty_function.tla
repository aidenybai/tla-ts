(*---
description: "The empty tuple equals any empty function."
ref: "tlc2/value/impl/TupleValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE empty_equals_empty_function ----
EXTENDS Integers
Test == <<>> = [x \in {} |-> 1] /\ [x \in {} |-> 1] = <<>> /\ [x \in 2..1 |-> 1] = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
