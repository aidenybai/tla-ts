(*---
description: "A function on an enumerated 1..n prints as a tuple."
ref: "tlc2/value/impl/FcnRcdValue.java#isTuple"
flags: [expression]
outcome: success
---*)
---- MODULE enum_one_to_n_is_tuple ----
EXTENDS Integers, TLC
Test == PrintT([i \in {2, 1} |-> i])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2>>"
---*)
