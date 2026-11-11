(*---
description: "A function on tuple keys prints with :> and @@."
ref: "tlc2/value/impl/FcnRcdValue.java#toString"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_keys ----
EXTENDS Integers, TLC
Test == PrintT([x \in {1}, y \in {2} |-> 3])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<1, 2>> :> 3)"
---*)
