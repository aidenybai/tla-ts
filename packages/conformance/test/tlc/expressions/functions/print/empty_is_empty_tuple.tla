(*---
description: "An empty function prints as the empty tuple."
ref: "tlc2/value/impl/FcnRcdValue.java#toString"
flags: [expression]
outcome: success
---*)
---- MODULE empty_is_empty_tuple ----
EXTENDS Integers, TLC
Test == PrintT([i \in {} |-> i])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
