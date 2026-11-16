(*---
description: "EXCEPT can replace a value with one of another type."
ref: "tlc2/value/impl/TupleValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE type_may_change ----
EXTENDS Integers
Test == [<<1>> EXCEPT ![1] = "a"][1] = "a"
====

(*--- recorded
all:
  exit: 0
---*)
