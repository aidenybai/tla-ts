(*---
description: "Each call has its own binding of a parameter name."
ref: "tlc2/util/Context.java#cons"
flags: [expression]
outcome: success
---*)
---- MODULE parameter_same_name_in_nested_calls ----
EXTENDS Integers
F(a) == a + 1
G(a) == F(a + 1) * a
Test == G(2) = 8
====

(*--- recorded
all:
  exit: 0
---*)
