(*---
description: "A record equals a function on the same strings, on either side."
ref: "tlc2/value/impl/RecordValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE equal_to_function ----
EXTENDS Integers, TLC
Test == [a |-> 1] = ("a" :> 1) /\ ("a" :> 1) = [a |-> 1] /\ [a |-> 1] = [x \in {"a"} |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
