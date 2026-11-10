(*---
description: "A function on 1..n prints as a tuple."
ref: "tlc2/value/impl/FcnRcdValue.java#toString"
flags: [expression]
outcome: success
---*)
---- MODULE interval_low_one_is_tuple ----
EXTENDS Integers, TLC
Test == PrintT([i \in 1..2 |-> i * 2])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 4>>"
---*)
