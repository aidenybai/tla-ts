(*---
description: "Tuple comparison stops at the first different component."
ref: "tlc2/value/impl/TupleValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE stops_at_first_difference ----
EXTENDS Integers
Test == <<1, "a">> # <<2, 1>>
====

(*--- recorded
all:
  exit: 0
---*)
