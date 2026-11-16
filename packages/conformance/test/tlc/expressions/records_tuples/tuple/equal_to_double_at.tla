(*---
description: "A tuple equals an unnormalized @@ of its keys."
ref: "tlc2/value/impl/TupleValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE equal_to_double_at ----
EXTENDS Integers, TLC
Test == <<1, 2>> = ((2 :> 2) @@ (1 :> 1))
====

(*--- recorded
all:
  exit: 0
---*)
