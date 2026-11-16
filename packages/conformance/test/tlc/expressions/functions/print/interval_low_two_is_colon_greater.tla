(*---
description: "A function on an interval starting elsewhere prints as :> and @@."
ref: "tlc2/value/impl/FcnRcdValue.java#toString"
flags: [expression]
outcome: success
---*)
---- MODULE interval_low_two_is_colon_greater ----
EXTENDS Integers, TLC
Test == PrintT([i \in 2..3 |-> i])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> 2 @@ 3 :> 3)"
---*)
