(*---
description: "A function on an empty interval converts to the empty tuple whatever its low bound."
ref: "tlc2/value/impl/FcnRcdValue.java#toTuple"
flags: [expression]
outcome: success
---*)
---- MODULE empty_function_to_tuple_any_low ----
EXTENDS Integers, Sequences
Test == [x \in 3..1 |-> 0] = <<>> /\ Len([x \in 3..1 |-> 0]) = 0
====

(*--- recorded
all:
  exit: 0
---*)
