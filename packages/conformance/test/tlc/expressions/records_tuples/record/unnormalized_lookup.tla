(*---
description: "Lookup works on a record whose names are not sorted."
ref: "tlc2/value/impl/RecordValue.java#find"
flags: [expression]
outcome: success
---*)
---- MODULE unnormalized_lookup ----
EXTENDS Integers
Test == [zb |-> 1, za |-> 2].za = 2
====

(*--- recorded
all:
  exit: 0
---*)
