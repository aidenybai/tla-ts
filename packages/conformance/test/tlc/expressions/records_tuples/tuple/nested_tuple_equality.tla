(*---
description: "Nested tuples compare recursively across representations."
ref: "tlc2/value/impl/TupleValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE nested_tuple_equality ----
EXTENDS Integers
Test == <<<<1>>, [i \in 1..1 |-> <<2>>]>> = <<[i \in 1..1 |-> 1], <<<<2>>>>>>
====

(*--- recorded
all:
  exit: 0
---*)
