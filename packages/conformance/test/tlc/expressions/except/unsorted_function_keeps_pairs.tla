(*---
description: "EXCEPT on an unnormalized function keeps each key with its value."
ref: "tlc2/value/impl/FcnRcdValue.java#snapshot"
flags: [expression]
outcome: success
---*)
---- MODULE unsorted_function_keeps_pairs ----
EXTENDS Integers, TLC
Test == [((2 :> 0) @@ (1 :> 5)) EXCEPT ![1] = 9] = ((1 :> 9) @@ (2 :> 0))
====

(*--- recorded
all:
  exit: 0
---*)
