(*---
description: "A function on non-contiguous integers prints as :> and @@."
ref: "tlc2/value/impl/FcnRcdValue.java#isTuple"
flags: [expression]
outcome: success
---*)
---- MODULE gap_is_colon_greater ----
EXTENDS Integers, TLC
Test == PrintT([i \in {1, 3} |-> i])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1 :> 1 @@ 3 :> 3)"
---*)
