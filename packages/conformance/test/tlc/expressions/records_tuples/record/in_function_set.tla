(*---
description: "A record belongs to the function set on its names."
ref: "tlc2/value/impl/SetOfFcnsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE in_function_set ----
EXTENDS Integers
Test == [a |-> 1, b |-> 2] \in [{"a", "b"} -> {1, 2}]
====

(*--- recorded
all:
  exit: 0
---*)
