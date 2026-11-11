(*---
description: "EXCEPT works on a function on an interval that does not start at 1."
ref: "tlc2/value/impl/FcnRcdValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE interval_function ----
EXTENDS Integers, TLC
Test == [[i \in 3..4 |-> 0] EXCEPT ![4] = 1] = (3 :> 0 @@ 4 :> 1)
====

(*--- recorded
all:
  exit: 0
---*)
