(*---
description: "A tuple is a function on 1..n."
ref: "tlc2/value/impl/TupleValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE apply_each_index ----
EXTENDS Integers
Test == <<7, 8>>[1] = 7 /\ <<7, 8>>[2] = 8
====

(*--- recorded
all:
  exit: 0
---*)
