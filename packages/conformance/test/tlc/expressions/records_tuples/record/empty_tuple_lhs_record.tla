(*---
description: "The empty tuple is unequal to a non-empty record with no error, by size."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE empty_tuple_lhs_record ----
EXTENDS Integers
Test == <<>> # [a |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
