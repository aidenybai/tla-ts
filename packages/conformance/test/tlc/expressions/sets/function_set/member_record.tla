(*---
description: "A record is a function on strings."
ref: "tlc2/value/impl/SetOfFcnsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_record ----
EXTENDS Integers
Test == [a |-> 1] \in [{"a"} -> {1}]
====

(*--- recorded
all:
  exit: 0
---*)
