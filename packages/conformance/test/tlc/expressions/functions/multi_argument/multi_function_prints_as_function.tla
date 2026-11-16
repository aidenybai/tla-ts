(*---
description: "A two-argument function equals the @@ of its pair keys."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE multi_function_prints_as_function ----
EXTENDS Integers, TLC
Test == [x \in {1}, y \in {2} |-> 3] = (<<1, 2>> :> 3)
====

(*--- recorded
all:
  exit: 0
---*)
